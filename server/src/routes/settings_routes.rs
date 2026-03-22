use axum::{Router, routing::get};

use axum::{Json, extract::State};
use types::settings::AppSettings;

use crate::AsyncAppState;

pub fn settings_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_settings).put(update_settings))
        .with_state(state)
}

async fn get_settings(State(state): State<AsyncAppState>) -> Json<AppSettings> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.settings.clone())
}

async fn update_settings(State(state): State<AsyncAppState>, Json(body): Json<AppSettings>) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.settings = body;
}
