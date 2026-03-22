use axum::{Router, routing::get};
use hyper::StatusCode;
use tracing::instrument;

use axum::{Json, extract::State};
use types::DebugInfo;

use crate::AsyncAppState;

pub fn debug_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_debug_info))
        .with_state(state)
}

#[instrument(skip(state))]
#[axum::debug_handler]
async fn get_debug_info(State(state): State<AsyncAppState>) -> (StatusCode, Json<DebugInfo>) {
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

    (StatusCode::OK, Json(debug_info))
}
