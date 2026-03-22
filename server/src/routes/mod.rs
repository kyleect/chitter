use std::sync::Arc;

use axum::Router;
use tokio::sync::Mutex;

use crate::{
    AppState,
    routes::{
        acheivements_routes::achievements_routes, completions_routes::completions_routes,
        conversations_routes::conversations_routes, debug_routes::debug_routes,
        insertables_routes::insertables_routes, personas_routes::persona_routes,
        settings_routes::settings_routes, templates_routes::templates_routes,
        websockets_routes::websockets_routes,
    },
};

pub mod acheivements_routes;
pub mod completions_routes;
pub mod conversations_routes;
pub mod debug_routes;
pub mod insertables_routes;
pub mod personas_routes;
pub mod settings_routes;
pub mod templates_routes;
pub mod websockets_routes;

pub fn api_routes(state: Arc<Mutex<AppState>>) -> Router<Arc<Mutex<AppState>>> {
    Router::new()
        .nest("/debug", debug_routes(state.clone()))
        .nest("/achievements", achievements_routes(state.clone()))
        .nest("/ws", websockets_routes(state.clone()))
        .nest("/insertables", insertables_routes(state.clone()))
        .nest("/templates", templates_routes(state.clone()))
        .nest("/conversations", conversations_routes(state.clone()))
        .nest("/personas", persona_routes(state.clone()))
        .nest("/completions", completions_routes(state.clone()))
        .nest("/settings", settings_routes(state.clone()))
        .with_state(state)
}
