use axum::{
    Router,
    extract::Path,
    routing::{delete, get},
};

use axum::{Json, extract::State};
use types::conversation::Conversation;

use crate::AsyncAppState;

pub fn conversations_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new().route("/", get(get_conversations)).route(
        "/{conversation_id}",
        delete(delete_conversation)
            .put(update_conversation)
            .with_state(state),
    )
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
