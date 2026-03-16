use std::{env::current_dir, path::PathBuf, sync::Arc, vec};

use async_openai::{
    Client,
    config::OpenAIConfig,
    types::{
        chat::{ChatCompletionRequestMessage, CreateChatCompletionRequestArgs},
        completions::CreateCompletionRequestArgs,
    },
};
use axum::{
    Json, Router,
    extract::{
        Request, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, delete, get, post},
};
use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use hyper::{body::Incoming, service::service_fn};
use hyper_util::{
    rt::{TokioExecutor, TokioIo},
    server,
};
use serde::{Deserialize, Serialize};
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
    conversation::{
        CompletionRequestBody, Conversation, ConversationTemplate, Persona,
        RegenerateResponseRequestBody,
        Role::{self, Assistant, User},
    },
    settings::{AppSettings, LLMConnection, LLMParameters},
    socket::ClientMessage,
};

#[cfg(not(feature = "development_mode"))]
use include_dir::include_dir;

#[cfg(feature = "development_mode")]
use tower_http::services::ServeDir;

#[cfg(not(feature = "development_mode"))]
use tower_serve_static::ServeDir as StaticServeDir;

use crate::services::{
    achievements_service,
    conversation_service::{
        delete_conversation, get_conversations, preview_conversation, start_conversation,
        update_conversation,
    },
    persona_services::{add_personas, delete_persona, get_persona, get_personas, update_persona},
    template_service::{
        create_template, delete_template, get_template, get_templates, update_template,
    },
};

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
    pub llm: Option<Client<OpenAIConfig>>,
    pub conversation_templates: Vec<ConversationTemplate>,
    pub conservations: Vec<Conversation>,
    pub personass: Vec<Persona>,
    pub settings: AppSettings,
    pub insertable_system_prompts: Vec<(String, String)>,
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

    let user_persona = Persona::new("User", Some("The user being responded to"));
    let assistant_persona = Persona::new(
        "AI Assistant",
        Some("The default AI assistant in the Chitter app."),
    );

    let template_1 = {
        let mut template = ConversationTemplate::new(Some("Example".to_string()));

        template.assistant_persona = Some(types::conversation::TemplatePersona::Id(
            assistant_persona.id.clone(),
        ));

        template.user_persona = Some(types::conversation::TemplatePersona::Id(
            user_persona.id.clone(),
        ));

        template.insertable_system_prompts.push((
            "test".to_string(),
            "A test insertable system prompt".to_string(),
        ));

        template.insertable_system_prompts.push((
            "test2".to_string(),
            "Another test insertable system prompt".to_string(),
        ));

        let summarize_as_list_var = template.set_var("summaryAsList", true.into());

        template.add_system_message("You are a helpful AI assistant.");

        template.add_assistant_message("Hello, I'm here to help! What can I do for you today?");

        template.inner_thoughts_message("I wonder what the task is.");

        template.add_user_message(
            "I need you to summarize some text for me, highlighting the most important details.",
        );

        template.ooc_message("Only respond with the summary of the text.");

        template.if_eq(&summarize_as_list_var, &true.into());

        template.ooc_message("Format the summary as a bulleted list");

        template.end_if();

        template.add_assistant_message("Send the text and I'll respond with a summary.");

        template
    };

    let template_2 = {
        let mut template = ConversationTemplate::new(Some("Joke".to_string()));

        template.assistant_persona = Some(types::conversation::TemplatePersona::Id(
            assistant_persona.id.clone(),
        ));

        template.user_persona = Some(types::conversation::TemplatePersona::Id(
            user_persona.id.clone(),
        ));

        template.add_assistant_message("Hello! Give me a word and I'll tell you a joke.");

        template
    };

    let template_3 = {
        let mut template = ConversationTemplate::new(Some("Prefilled User Reply".to_string()));

        template.assistant_persona = Some(Persona::new("Assistant", None).into());

        template.user_persona = Some(Persona::new("User", None).into());

        template.add_user_message("Example of a prefilled user reply on conversation start");

        template
    };

    let app_settings = AppSettings::builder()
        .default_assistant_persona_id(assistant_persona.id.clone())
        .default_user_persona_id(user_persona.id.clone())
        .connection(
            LLMConnection::builder()
                .maybe_api_key(None)
                .maybe_url(Some("http://localhost:8080/v1".to_string()))
                .build(),
        )
        .params(
            LLMParameters::builder()
                .temperature(0.8f32)
                .system_prompt("You are a helpful AI assistant.".to_string())
                .max_tokens(500)
                .top_k(60)
                .top_p(0.95)
                .min_p(0.05)
                .build(),
        )
        .build();

    let client = Client::with_config(
        OpenAIConfig::new().with_api_base(
            &app_settings
                .connection
                .clone()
                .url
                .expect("should have url set in settings above"),
        ),
    );

    let personas_insertable = "
You are {{CHAR}}. I am {{USER}}.

---
{{CHAR}}'s Description:

{{CHAR_DESCRIPTION}}
---
{{USER}}'s Description:

{{USER_DESCRIPTION}}
---

    "
    .trim();

    let text_message_insertable = "
This is a text message conversation.
    "
    .trim();

    let in_person_insertable = "
This is an in person conversation.
    "
    .trim();

    let video_call_insertable = "
This is video call.
    "
    .trim();

    let state = AppState {
        home_dir: project_dir,
        db: Some(db_pool),
        db_is_encrypted,
        tx: None,
        llm: Some(client),
        conversation_templates: vec![template_1.clone(), template_2.clone(), template_3.clone()],
        conservations: vec![],
        personass: vec![assistant_persona, user_persona],
        settings: app_settings,
        insertable_system_prompts: vec![
            ("Personas".to_string(), personas_insertable.to_string()),
            (
                "Type: Text Message".to_string(),
                text_message_insertable.to_string(),
            ),
            (
                "Type: In Person Conversation".to_string(),
                in_person_insertable.to_string(),
            ),
            (
                "Type: Video Call".to_string(),
                video_call_insertable.to_string(),
            ),
        ],
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
        .route(
            "/api/insertables",
            get(get_insertables).put(update_insertables),
        )
        .route("/api/templates", get(get_templates).post(create_template))
        .route(
            "/api/templates/{template_id}",
            get(get_template)
                .put(update_template)
                .delete(delete_template),
        )
        .route(
            "/api/templates/{template_id}/preview",
            get(preview_conversation),
        )
        .route(
            "/api/templates/{template_id}/chat",
            post(start_conversation),
        )
        .route(
            "/api/conversations",
            get(get_conversations).post(start_conversation),
        )
        .route(
            "/api/conversations/{conversation_id}",
            delete(delete_conversation).put(update_conversation),
        )
        .route("/api/personas", get(get_personas).post(add_personas))
        .route(
            "/api/personas/{persona_id}",
            get(get_persona).delete(delete_persona).put(update_persona),
        )
        .route("/api/completions", post(completetion))
        .route("/api/chat_completions", post(chat_completion))
        .route(
            "/api/chat_completions/regenerate_response",
            post(regenerate_response),
        )
        .route("/api/settings", get(get_settings).post(update_settings))
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

fn build_prompt(conversation: &Conversation, assistant_name: &str, user_name: &str) -> String {
    let messages: Vec<String> = conversation
        .messages
        .iter()
        .map(|message| {
            format!(
                "{:?}: {}",
                match message.role {
                    User => user_name,
                    Assistant => assistant_name,
                    _ => todo!(),
                },
                message.message.clone().unwrap_or_default()
            )
        })
        .collect();
    let messages = messages.join("\n\n");

    format!(
        "
The following is a conversation between '{assistant_name}' and '{user_name}'. You are {assistant_name}. It's your turn to respond. Write your next response.

Conversation:

{messages}
    "
    )
}

pub async fn get_insertables(
    State(state): State<Arc<Mutex<AppState>>>,
) -> Json<Vec<(String, String)>> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.insertable_system_prompts.clone())
}

pub async fn update_insertables(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<Vec<(String, String)>>,
) -> Json<Vec<(String, String)>> {
    let state = state.clone();
    let mut state = state.lock().await;

    state.insertable_system_prompts = body.clone();

    Json(body)
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CompletionResponse {
    pub response: String,
}

pub async fn chat_completion(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<CompletionRequestBody>,
) -> CompletionResponse {
    let state = state.clone();
    let mut state = state.lock().await;

    {
        let conversation = state
            .conservations
            .iter_mut()
            .find(|c| c.id == body.conversation_id)
            .expect(&format!(
                "should find conversation by id {}",
                body.conversation_id
            ));

        conversation.messages.push(
            types::conversation::Message::builder()
                .role(User)
                .message(body.prompt.clone())
                .build(),
        );
    };

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    let assistant_persona = &conversation.assistant_persona;

    let user_persona = &conversation.user_persona;

    if let Some(client) = &state.llm {
        let request = CreateChatCompletionRequestArgs::default()
            .frequency_penalty(1.0)
            .temperature(state.settings.params.temperature.clone().unwrap_or(0.8f32))
            .max_tokens(state.settings.params.max_tokens.clone().unwrap_or(500))
            .top_p(state.settings.params.top_p.clone().unwrap_or(0.95))
            .messages(
                conversation
                    .messages
                    .iter()
                    .map(|message| {
                        // Update message.message if is Some
                        let new_message_string = message.message.as_ref().map(|message| {
                            message
                                .replace("{{CHAR}}", &assistant_persona.name)
                                .replace("{{CHAR_DESCRIPTION}}", &assistant_persona.description)
                                .replace("{{USER}}", &assistant_persona.name)
                                .replace("{{USER_DESCRIPTION}}", &user_persona.description)
                        });

                        let mut new_message = message.clone();

                        new_message.message = new_message_string;

                        let m: ChatCompletionRequestMessage = new_message.try_into().unwrap();

                        dbg!(&m);

                        m
                    })
                    .collect::<Vec<_>>(),
            )
            .build()
            .expect("should build chat completion request");

        dbg!(&request);

        let response = client.chat().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                (*conversation).messages.push(
                    types::conversation::Message::builder()
                        .role(Assistant)
                        .message(first_choice.message.content.clone().unwrap_or_default())
                        .build(),
                );

                return CompletionResponse {
                    response: first_choice.message.content.clone().unwrap_or_default(),
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return CompletionResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    todo!()
}

impl IntoResponse for CompletionResponse {
    fn into_response(self) -> Response {
        (StatusCode::OK, serde_json::to_string_pretty(&self).unwrap()).into_response()
    }
}

pub async fn completetion(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<CompletionRequestBody>,
) -> CompletionResponse {
    let state = state.clone();
    let mut state = state.lock().await;

    let (assistant_persona_id, user_persona_id) = {
        let conversation = state
            .conservations
            .iter_mut()
            .find(|c| c.id == body.conversation_id)
            .expect(&format!(
                "should find conversation by id {}",
                body.conversation_id
            ));

        conversation.messages.push(
            types::conversation::Message::builder()
                .role(User)
                .message(body.prompt.clone())
                .build(),
        );

        (
            conversation.assistant_persona.id.clone(),
            conversation.user_persona.id.clone(),
        )
    };

    let assistant_persona = state
        .personass
        .iter()
        .find(|p| p.id == assistant_persona_id)
        .expect("conversation should have assistant persona");

    let user_persona = state
        .personass
        .iter()
        .find(|p| p.id == user_persona_id)
        .expect("conversation should have user persona");

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    let prompt = build_prompt(conversation, &assistant_persona.name, &user_persona.name);

    if let Some(client) = &state.llm {
        let request = CreateCompletionRequestArgs::default()
            .prompt(prompt)
            .max_tokens(400_u32)
            .temperature(body.settings.temperature.unwrap_or(0.8f32))
            .build()
            .expect("should create completion request");

        let response = client.completions().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                (*conversation).messages.push(
                    types::conversation::Message::builder()
                        .role(Assistant)
                        .message(first_choice.text.clone())
                        .build(),
                );

                return CompletionResponse {
                    response: first_choice.text.clone(),
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return CompletionResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    CompletionResponse {
        response: "FALLBACK TODO!".to_string(),
    }
}

pub async fn update_settings(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<AppSettings>,
) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.settings = body;
}

pub async fn get_settings(State(state): State<Arc<Mutex<AppState>>>) -> Json<AppSettings> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.settings.clone())
}

pub async fn regenerate_response(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(body): Json<RegenerateResponseRequestBody>,
) -> CompletionResponse {
    let state = state.clone();

    let last_message: Option<types::conversation::Message>;

    {
        let mut state = state.lock().await;
        let conversation = state
            .conservations
            .iter_mut()
            .find(|c| c.id == body.conversation_id)
            .unwrap();

        // Remove the last message from conversation.messages
        last_message = (*conversation).messages.pop();
    };

    let mut state = state.lock().await;

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    if let Some(client) = &state.llm {
        let mut messages = conversation.messages.clone();

        if let Some(guidance_prompt) = body.guidance_prompt {
            messages.push(
                types::conversation::Message::builder()
                    .role(Role::System)
                    .message(format!(
                        "
Use this response
Rewrite this message, using the guidance prompt below, and use this as your response.

Guidance Prompt:

{guidance_prompt}

Messsage To Rewrite:

{}
",
                        last_message
                            .expect("there should be a last message")
                            .message
                            .unwrap_or_default()
                    ))
                    .build(),
            );
        }

        let request = CreateChatCompletionRequestArgs::default()
            .temperature(state.settings.params.temperature.clone().unwrap_or(0.8f32))
            .max_tokens(state.settings.params.max_tokens.clone().unwrap_or(500))
            .top_p(state.settings.params.top_p.clone().unwrap_or(0.95))
            .messages(
                messages
                    .iter()
                    .map(|message| {
                        let m: ChatCompletionRequestMessage = message.clone().try_into().unwrap();

                        m
                    })
                    .collect::<Vec<_>>(),
            )
            .build()
            .expect("should build chat completion request");

        let response = client.chat().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                let generated_response = first_choice.message.content.clone().unwrap_or_default();

                (*conversation).messages.push(
                    types::conversation::Message::builder()
                        .role(Role::Assistant)
                        .message(generated_response.clone())
                        .build(),
                );

                return CompletionResponse {
                    response: generated_response,
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return CompletionResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    todo!()
}
