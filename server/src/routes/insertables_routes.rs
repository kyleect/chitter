use axum::{Router, routing::get};

use axum::{Json, extract::State};

use crate::AsyncAppState;

pub fn insertables_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_insertables).put(update_insertables))
        .with_state(state)
}

async fn get_insertables(State(state): State<AsyncAppState>) -> Json<Vec<(String, String)>> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.insertable_system_prompts.clone())
}

async fn update_insertables(
    State(state): State<AsyncAppState>,
    Json(body): Json<Vec<(String, String)>>,
) -> Json<Vec<(String, String)>> {
    let state = state.clone();
    let mut state = state.lock().await;

    state.insertable_system_prompts = body.clone();

    Json(body)
}
