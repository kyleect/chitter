use axum::{Router, routing::get};
use hyper::StatusCode;

use crate::AsyncAppState;

use axum::{
    Json,
    extract::{Path, State},
};
use types::persona::{NewPersona, Persona};

pub fn persona_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_personas).post(add_personas))
        .route(
            "/{persona_id}",
            get(get_persona).put(update_persona).delete(delete_persona),
        )
        .with_state(state)
}

async fn get_personas(State(state): State<AsyncAppState>) -> Json<Vec<Persona>> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.personass.clone())
}

async fn add_personas(
    State(state): State<AsyncAppState>,
    Json(body): Json<NewPersona>,
) -> Json<Persona> {
    let state = state.clone();
    let mut state = state.lock().await;

    let persona = Persona::new(&body.name, body.description.as_deref());

    state.personass.push(persona.clone());

    Json(persona)
}

async fn get_persona(
    State(state): State<AsyncAppState>,
    Path(persona_id): Path<String>,
) -> Json<Persona> {
    let state = state.clone();
    let mut state = state.lock().await;

    let persona = state
        .personass
        .iter_mut()
        .find(|t| t.id == persona_id)
        .ok_or(StatusCode::NOT_FOUND)
        .unwrap();

    Json(persona.clone())
}

async fn delete_persona(State(state): State<AsyncAppState>, Path(persona_id): Path<String>) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.personass = state
        .personass
        .iter()
        .filter(|x| x.id != persona_id)
        .cloned()
        .collect();
}

async fn update_persona(
    State(state): State<AsyncAppState>,
    Path(persona_id): Path<String>,
    Json(body): Json<Persona>,
) -> Json<Persona> {
    let state = state.clone();
    let mut state = state.lock().await;

    let persona = state.personass.iter_mut().find(|t| t.id == persona_id);

    match persona {
        Some(persona) => {
            *persona = body;

            Json(persona.clone())
        }
        None => {
            state.personass.push(body.clone());
            Json(body)
        }
    }
}
