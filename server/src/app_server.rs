use std::{env::current_dir, path::PathBuf, sync::Arc};

use axum::Router;
use bon::Builder;
use hyper::{Request, body::Incoming, service::service_fn};
use hyper_util::{
    rt::{TokioExecutor, TokioIo},
    server,
};
use tokio::{net::TcpListener, spawn, sync::Mutex};
use tower::Service;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing::{error, info_span};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[cfg(not(feature = "development_mode"))]
use include_dir::include_dir;

#[cfg(feature = "development_mode")]
use tower_http::services::ServeDir;

#[cfg(not(feature = "development_mode"))]
use tower_serve_static::ServeDir as StaticServeDir;

use crate::{
    app_state::{AppState, AsyncAppState},
    db::{DATABASE_URL_ENV_VAR, DEFAULT_DB_FILENAME, DbEncryption, DbOptions, connect_to_db},
    errors::ServerError,
    routes::api_routes,
};

pub struct AppServer(pub TcpListener, pub Router);

impl AppServer {
    pub async fn start<F>(self, on_ready: &F) -> Result<(), ServerError>
    where
        F: Fn(),
    {
        let Self(listener, router) = self;

        // Call `on_ready` only once
        let mut called_ready = false;
        loop {
            if !called_ready {
                on_ready();
                called_ready = true;
            }

            let pending_accept = listener.accept();

            let (socket, _remote_addr) = pending_accept.await.unwrap();

            let tower_service = router.clone();

            spawn(async move {
                let socket = TokioIo::new(socket);

                let hyper_service = service_fn(move |request: Request<Incoming>| {
                    tower_service.clone().call(request)
                });

                if let Err(err) = server::conn::auto::Builder::new(TokioExecutor::new())
                    .serve_connection_with_upgrades(socket, hyper_service)
                    .await
                {
                    error!("failed to serve connection: {err:#}");
                }
            });
        }
    }

    pub fn url(&self) -> String {
        let Self(listener, _) = self;
        let url = format!("http://{}", listener.local_addr().expect("should get url"));

        url
    }
}

#[derive(Builder)]
pub struct InitServerOptions {
    pub port: Option<u16>,
    pub open_browser: bool,
    pub db_options: DbOptions,
}

pub async fn init_server(options: InitServerOptions) -> Result<AppServer, ServerError> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                // axum logs rejections from built-in extractors with the `axum::rejection`
                // target, at `TRACE` level. `axum::rejection=trace` enables showing those events
                format!(
                    "{}=info,tower_http=debug,axum::rejection=trace",
                    env!("CARGO_CRATE_NAME")
                )
                .into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Get port or default to a random port
    let port = options.port.unwrap_or(0);

    // Dynamically serve the static directory for development
    #[cfg(feature = "development_mode")]
    let static_dir = {
        use tracing::info;

        info!("App starting in development mode");
        ServeDir::new(format!("{}/static", env!("CARGO_MANIFEST_DIR")))
    };

    // Package the files in static inside built binary
    #[cfg(not(feature = "development_mode"))]
    let static_dir = {
        use include_dir::Dir;
        use tracing::info;

        info!("App starting in production mode");
        static ASSETS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/static");
        StaticServeDir::new(&ASSETS_DIR)
    };

    let project_dir = match std::env::var("project_dir") {
        Ok(project_dir) => PathBuf::from(&project_dir),
        Err(_) => current_dir().expect("should have current directory"),
    };

    #[cfg(feature = "development_mode")]
    let project_dir = {
        let project_dir = project_dir.parent().unwrap().to_path_buf();

        project_dir
    };

    // Default path to database in order of priority
    //
    // 1. Enivornment variable `$DATABASE_URL`
    // 2. User home directory  `$HOME/chitter.sqlite3`
    // 3. Current directory    `$CWD/chitter.sqlite3`
    let default_db_path = {
        let db_path_env_var = std::env::var(DATABASE_URL_ENV_VAR);

        db_path_env_var.unwrap_or(
            project_dir
                .join(DEFAULT_DB_FILENAME)
                .to_string_lossy()
                .to_string(),
        )
    };

    let db_is_encrypted = matches!(options.db_options.encryption, DbEncryption::Encrypted(_, _));

    let db_pool = connect_to_db(options.db_options, default_db_path).await;

    let state: AsyncAppState = {
        let mut state = AppState::default();

        state.home_dir = Some(project_dir);
        state.db = Some(db_pool);
        state.db_is_encrypted = db_is_encrypted;

        Arc::new(Mutex::new(state))
    };

    let listener = tokio::net::TcpListener::bind(format!("localhost:{}", port)).await?;
    let addr = listener.local_addr()?;
    let url = format!("http://{addr}");

    tracing::info!("listening on {}", url);

    if options.open_browser && webbrowser::Browser::is_available() {
        webbrowser::open(&url).map_err(ServerError::from)?;
    }

    let compression_layer: CompressionLayer =
        CompressionLayer::new().br(true).deflate(true).gzip(true);

    let app = Router::new()
        .nest("/api", api_routes(state.clone()))
        .fallback_service(static_dir.clone())
        .with_state(state)
        .layer(compression_layer)
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                let path = Some(request.uri().to_string());

                info_span!(
                    "http_request",
                    method = ?request.method(),
                    path,
                )
            }),
        );

    Ok(AppServer(listener, app))
}
