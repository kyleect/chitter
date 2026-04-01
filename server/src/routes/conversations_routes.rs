use axum::{
    Router,
    extract::{Path, Query},
    routing::{delete, get, post},
};

use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};
use types::conversation::Conversation;

use crate::app_state::AsyncAppState;

pub fn conversations_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_conversations))
        .route(
            "/{conversation_id}",
            delete(delete_conversation)
                .put(update_conversation)
                .with_state(state),
        )
        .route("/{conversation_id}/fork", post(fork_conversation))
}

async fn get_conversations(State(state): State<AsyncAppState>) -> Json<Vec<Conversation>> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.conservations.clone())
}

async fn delete_conversation(
    State(state): State<AsyncAppState>,
    Path(conversation_id): Path<String>,
) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.conservations = state
        .conservations
        .iter()
        .filter(|x| x.id != conversation_id)
        .cloned()
        .collect();
}

async fn update_conversation(
    State(state): State<AsyncAppState>,
    Path(conversation_id): Path<String>,
    Json(body): Json<Conversation>,
) -> Json<Conversation> {
    let state = state.clone();
    let mut state = state.lock().await;

    let template = state
        .conservations
        .iter_mut()
        .find(|t| t.id == conversation_id);

    match template {
        Some(template) => {
            *template = body;

            Json(template.clone())
        }
        None => {
            state.conservations.push(body.clone());
            Json(body)
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ForkConversationParams {
    at: Option<usize>,
}

async fn fork_conversation(
    State(state): State<AsyncAppState>,
    Path(conversation_id): Path<String>,
    Query(params): Query<ForkConversationParams>,
) -> Json<Conversation> {
    let state = state.clone();
    let mut state = state.lock().await;

    let conversation = state
        .conservations
        .iter_mut()
        .find(|t| t.id == conversation_id)
        .expect("should find conversation by id");

    let mut new_conversation = conversation.fork();
    new_conversation.title = new_conversation
        .title
        .as_ref()
        .map(|title| format!("{title} (Fork)"));
    new_conversation.id = uuid::Uuid::new_v4().to_string();

    if let Some(at) = params.at {
        new_conversation.messages = new_conversation.messages.clone()[..at + 1].to_vec();
    }

    state.conservations.push(new_conversation.clone());

    Json(new_conversation)
}
