use axum::{Router, routing::get};

use std::sync::Arc;

use axum::{Json, extract::State};
use tokio::sync::Mutex;
use types::settings::AppSettings;

use crate::AppState;

pub fn settings_routes(state: Arc<Mutex<AppState>>) -> Router<Arc<Mutex<AppState>>> {
    Router::new()
        .route("/", get(get_settings).put(update_settings))
        .with_state(state)
}

async fn get_settings(State(state): State<Arc<Mutex<AppState>>>) -> Json<AppSettings> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.settings.clone())
}

async fn update_settings(State(state): State<Arc<Mutex<AppState>>>, Json(body): Json<AppSettings>) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.settings = body;
}
