use std::{env::current_dir, path::PathBuf, sync::Arc};

use axum::{
    Json, Router,
    extract::{
        Request, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, get, post},
};
use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use hyper::{body::Incoming, service::service_fn};
use hyper_util::{
    rt::{TokioExecutor, TokioIo},
    server,
};
use serde_json::from_str;
use sqlx::{Pool, Sqlite, SqlitePool, migrate::Migrator, sqlite::SqliteConnectOptions};
use tokio::{
    net::TcpListener,
    spawn,
    sync::{
        Mutex,
        mpsc::{UnboundedSender, unbounded_channel},
    },
};
use tower::Service;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing::{error, info, info_span, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use types::{
    DebugInfo,
    achievement::{AchievementDto, AchievementId},
    socket::ClientMessage,
};

#[cfg(not(feature = "development_mode"))]
use include_dir::include_dir;

#[cfg(feature = "development_mode")]
use tower_http::services::ServeDir;

#[cfg(not(feature = "development_mode"))]
use tower_serve_static::ServeDir as StaticServeDir;

use crate::services::achievements_service;

pub mod services;

static MIGRATOR: Migrator = sqlx::migrate!();

const DATABASE_URL_ENV_VAR: &str = "DATABASE_URL";
const DEFAULT_DB_FILENAME: &str = "chitter.sqlite3";

#[derive(Debug)]
pub enum Error {
    Io(String),
    DbEncryptionKeyRequiredButNotProvided,
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Error::Io(printable) => write!(f, "{}", printable),
            Error::DbEncryptionKeyRequiredButNotProvided => {
                write!(f, "Db encryption key required but not provided")
            }
        }
    }
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Error::Io(err.to_string())
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let body = self.to_string();

        error!(body);
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

#[derive(Clone, Debug)]
pub struct AppState {
    pub home_dir: PathBuf,
    pub db: Option<Pool<Sqlite>>,
    pub db_is_encrypted: bool,
    pub tx: Option<Arc<Mutex<UnboundedSender<String>>>>,
}

impl AppState {
    pub fn reset(&mut self) {}

    pub fn set_db(&mut self, db: Option<Pool<Sqlite>>) {
        self.db = db;
    }
}

#[derive(Parser)]
pub struct Args {
    /// Set which port to use (default: random)
    #[arg(long)]
    pub port: Option<u16>,
    /// Open the URL in a browser after starting the server (default: true)
    #[arg(long)]
    pub open: Option<bool>,
    /// Path to sqlite3 database file
    #[arg(long)]
    pub db: Option<String>,
    /// Key used to encrypt the database
    #[arg(long = "db_encryption_key", env = "CHITTER_DB_KEY")]
    pub db_encryption_key: String,
    /// Key used as database's new encryption key
    #[arg(long = "db_encryption_rekey", env = "CHITTER_DB_REKEY")]
    pub db_encryption_rekey: Option<String>,
}

pub struct AppServer(TcpListener, Router);

impl AppServer {
    pub async fn start<F>(self, on_ready: &F) -> Result<(), Error>
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

pub struct InitServerOptions {
    pub port: Option<u16>,
    pub open_browser: bool,
    pub db_options: DbOptions,
}

pub struct DbOptions {
    pub path: Option<String>,
    pub encryption: DbEncryption,
}

#[derive(Debug)]
pub enum DbEncryption {
    Unencrypted,
    Encrypted(String, Option<String>),
}

pub async fn init_server(options: InitServerOptions) -> Result<AppServer, Error> {
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
        info!("App starting in development mode");
        ServeDir::new(format!("{}/static", env!("CARGO_MANIFEST_DIR")))
    };

    // Package the files in static inside built binary
    #[cfg(not(feature = "development_mode"))]
    let static_dir = {
        use include_dir::Dir;

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

    let state = AppState {
        home_dir: project_dir,
        db: Some(db_pool),
        db_is_encrypted,
        tx: None,
    };

    let state = Arc::new(Mutex::new(state));

    let listener = tokio::net::TcpListener::bind(format!("localhost:{}", port)).await?;
    let addr = listener.local_addr()?;
    let url = format!("http://{addr}");

    tracing::info!("listening on {}", url);

    if options.open_browser && webbrowser::Browser::is_available() {
        webbrowser::open(&url).map_err(crate::Error::from)?;
    }

    let compression_layer: CompressionLayer =
        CompressionLayer::new().br(true).deflate(true).gzip(true);

    let app = Router::new()
        .route("/api/debug", get(get_debug_info))
        .route("/api/debug/achievement", post(trigger_test_achievement))
        .route("/api/achievements", get(get_achievements))
        .route("/api/ws", any(ws_handler))
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

async fn connect_to_db(db_options: DbOptions, default_db_path: String) -> Pool<Sqlite> {
    let mut pool_options = SqliteConnectOptions::new()
        .filename(db_options.path.unwrap_or(default_db_path))
        .create_if_missing(true);

    if let DbEncryption::Encrypted(encryption_key, _) = &db_options.encryption {
        let encryption_key = format!("'{}'", encryption_key.replace("'", "''"));

        pool_options = pool_options.pragma("key", encryption_key);
    }

    if let DbEncryption::Encrypted(_, Some(encryption_rekey)) = &db_options.encryption {
        let encryption_rekey = format!("'{}'", encryption_rekey.replace("'", "''"));

        pool_options = pool_options.pragma("rekey", encryption_rekey);
    }

    let pool = SqlitePool::connect_with(pool_options)
        .await
        .expect("should connect to db");

    let _ = MIGRATOR.run(&pool).await;

    pool
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn trigger_test_achievement(State(state): State<Arc<Mutex<AppState>>>) -> StatusCode {
    let _ = achievements_service::complete_achievement(
        state.clone(),
        AchievementId::TESTING_ACHIEVEMENTS,
    )
    .await;

    StatusCode::NO_CONTENT
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn get_debug_info(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<DebugInfo>) {
    let state = state.clone();

    let project_dir = {
        let state = state.lock().await;

        let cwd = state.home_dir.clone();

        cwd.to_str().unwrap_or_default().to_string()
    };

    let db = {
        let state = state.lock().await;

        state
            .db
            .as_ref()
            .unwrap()
            .connect_options()
            .get_filename()
            .to_str()
            .unwrap_or_default()
            .to_string()
    };

    let db_is_encrypted = {
        let state = state.lock().await;

        state.db_is_encrypted
    };

    let commit = env!("GIT_HASH").to_string();

    let debug_info = DebugInfo {
        cwd: project_dir,
        db,
        db_is_encrypted,
        commit,
    };

    let _ = achievements_service::complete_achievement(state.clone(), AchievementId::WHATS_IN_HERE)
        .await;

    (StatusCode::OK, Json(debug_info))
}

pub async fn reset_app_state(State(state): State<Arc<Mutex<AppState>>>) -> StatusCode {
    let state = state.clone();
    let mut state = state.lock().await;

    state.reset();

    StatusCode::NO_CONTENT
}

#[axum::debug_handler]
#[instrument(skip(ws, state))]
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<Mutex<AppState>>>,
) -> impl IntoResponse {
    // finalize the upgrade process by returning upgrade callback.
    // we can customize the callback by sending additional info such as address.
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

#[instrument(skip(socket, state))]
async fn handle_socket(socket: WebSocket, state: Arc<Mutex<AppState>>) {
    info!("WebSocket connection established");

    let (tx, mut rx) = unbounded_channel::<String>();

    let (mut sender, mut reciever) = socket.split();

    {
        let mut locked_state = state.lock().await;
        locked_state.tx = Some(Arc::new(tx.into()));
    }

    let send_task = spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Keep reading from the socket to detect disconnects
    while let Some(Ok(msg)) = reciever.next().await {
        match msg {
            Message::Text(utf8_bytes) => {
                match from_str::<ClientMessage>(utf8_bytes.as_str()).unwrap() {
                    ClientMessage::Log { level, message } => {
                        info!("client log: [{level}] {message}");
                    }
                    ClientMessage::Navigation { from, to } => match from {
                        None => info!("client navigation to '{to}'"),
                        Some(from) => info!("client navigation from '{from}' to '{to}'"),
                    },
                }
            }
            Message::Close(_) => {
                info!("Closing connection");
                break;
            }
            _ => {}
        }
    }

    // Remove client and clean up
    {
        info!("Cleaning tx");
        let mut state = state.lock().await;

        state.tx = None;
    }

    send_task.abort();
}

pub async fn get_achievements(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<Vec<AchievementDto>>) {
    (
        StatusCode::OK,
        Json(achievements_service::get_achievements(state).await),
    )
}
