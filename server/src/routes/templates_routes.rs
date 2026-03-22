use axum::{
    Router,
    extract::Query,
    routing::{get, post},
};

use crate::AsyncAppState;

use axum::{
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};
use types::{
    conversation::Conversation,
    templates::{ConversationTemplate, personas::TemplatePersona},
};

pub fn templates_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_templates).post(create_template))
        .route(
            "/{template_id}",
            get(get_template)
                .put(update_template)
                .delete(delete_template),
        )
        .route("/{template_id}/preview", get(preview_conversation))
        .route("/{template_id}/chat", post(start_conversation))
        .with_state(state)
}

async fn get_templates(State(state): State<AsyncAppState>) -> Json<Vec<ConversationTemplate>> {
    let state = state.clone();
    let state = state.lock().await;

    Json(state.conversation_templates.clone())
}

#[derive(Deserialize, Serialize)]
struct CreateTemplateBody {
    title: Option<String>,
}

async fn create_template(
    State(state): State<AsyncAppState>,
    Json(body): Json<CreateTemplateBody>,
) -> Json<ConversationTemplate> {
    let state = state.clone();
    let mut state = state.lock().await;

    let default_assistant_persona_id = state
        .settings
        .default_assistant_persona_id
        .clone()
        .unwrap_or_default();

    let default_assistant_persona = state
        .personass
        .iter()
        .find(|t| t.id == default_assistant_persona_id);

    let default_user_persona_id = state
        .settings
        .default_user_persona_id
        .clone()
        .unwrap_or_default();

    let default_user_persona = state
        .personass
        .iter()
        .find(|t| t.id == default_user_persona_id);

    let mut created_template = ConversationTemplate::new(body.title);

    if let Some(default_assistant_persona) = default_assistant_persona {
        created_template.assistant_persona =
            Some(TemplatePersona::Id(default_assistant_persona.id.clone()))
    }

    if let Some(default_user_persona) = default_user_persona {
        created_template.user_persona = Some(TemplatePersona::Id(default_user_persona.id.clone()))
    }

    state.conversation_templates.push(created_template.clone());

    Json(created_template)
}

async fn get_template(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
) -> Json<ConversationTemplate> {
    let state = state.clone();
    let state = state.lock().await;

    Json(
        state
            .conversation_templates
            .iter()
            .find(|x| x.id == template_id)
            .cloned()
            .expect(&format!("should have template by id: {template_id}")),
    )
}

async fn update_template(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
    Json(body): Json<ConversationTemplate>,
) -> Json<ConversationTemplate> {
    let state = state.clone();
    let mut state = state.lock().await;

    let template = state
        .conversation_templates
        .iter_mut()
        .find(|t| t.id == template_id);

    match template {
        Some(template) => {
            *template = body;

            Json(template.clone())
        }
        None => {
            state.conversation_templates.push(body.clone());
            Json(body)
        }
    }
}

async fn delete_template(State(state): State<AsyncAppState>, Path(template_id): Path<String>) {
    let state = state.clone();
    let mut state = state.lock().await;

    state.conversation_templates = state
        .conversation_templates
        .iter()
        .filter(|x| x.id != template_id)
        .cloned()
        .collect();
}

#[derive(Serialize, Deserialize)]
struct PreviewQueryParams {
    at: Option<usize>,
}

async fn preview_conversation(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
    Query(params): Query<PreviewQueryParams>,
) -> Json<Conversation> {
    let state = state.clone();
    let state = state.lock().await;

    let mut template = state
        .conversation_templates
        .iter()
        .find(|x| x.id == template_id)
        .cloned()
        .expect("should have template by id");

    let assistant_persona_from_id =
        template
            .assistant_persona
            .as_ref()
            .and_then(|template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(&persona),
            });

    let user_persona_from_id =
        template
            .user_persona
            .as_ref()
            .and_then(|template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(&persona),
            });

    if let Some(at) = params.at
        && at > 0
    {
        template.blocks = template.blocks[..at].to_vec()
    }

    let conversation: Conversation =
        Conversation::from_template(&template, assistant_persona_from_id, user_persona_from_id);

    Json(conversation)
}

async fn start_conversation(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
) -> Json<Conversation> {
    let state = state.clone();
    let mut state = state.lock().await;

    let template = state
        .conversation_templates
        .iter()
        .find(|x| x.id == template_id)
        .cloned()
        .expect("should have template by id");

    dbg!("start_conversation", &template);

    let assistant_persona_from_id =
        template
            .assistant_persona
            .as_ref()
            .and_then(|template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(&persona),
            });

    let user_persona_from_id =
        template
            .user_persona
            .as_ref()
            .and_then(|template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(&persona),
            });

    let conversation: Conversation =
        Conversation::from_template(&template, assistant_persona_from_id, user_persona_from_id);

    dbg!("start_conversation", &conversation);

    state.conservations.push(conversation.clone());

    Json(conversation)
}
