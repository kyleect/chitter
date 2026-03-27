use axum::{
    Router,
    extract::Multipart,
    routing::{get, post},
};
use card_parser::io::read_card_from_bytes;
use hyper::StatusCode;
use serde_json::json;

use crate::app_state::AsyncAppState;

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
        .route("/upload", post(upload_png))
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

async fn upload_png(mut multipart: Multipart) -> Result<Json<serde_json::Value>, StatusCode> {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap_or("");

        if name == "file" {
            let data = field.bytes().await.unwrap();

            match read_card_from_bytes(&data) {
                Ok(card) => {
                    return Ok(Json(json!({
                        "success": true,
                        "card": card
                    })));
                }
                Err(err) => {
                    return Ok(Json(json!({
                        "success": false,
                        "error": err.to_string()
                    })));
                }
            }
        }
    }

    Err(StatusCode::BAD_REQUEST)
}
