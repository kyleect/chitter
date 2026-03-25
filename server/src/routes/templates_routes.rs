use axum::{
    Router,
    extract::Query,
    routing::{get, post},
};

use crate::app_state::AsyncAppState;

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

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct PreviewQueryParams {
    at: Option<usize>,
    variant_id: Option<String>,
}

async fn preview_conversation(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
    Query(params): Query<PreviewQueryParams>,
) -> Json<Conversation> {
    let state = state.clone();
    let state = state.lock().await;

    dbg!(&params);

    let mut template = state
        .conversation_templates
        .iter()
        .find(|x| x.id == template_id)
        .cloned()
        .expect("should have template by id");

    let template_blocks = template.blocks.clone();

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

    let variant = params.variant_id.and_then(|variant_id| {
        template
            .variants
            .iter_mut()
            .find(|variant| variant.id == variant_id)
    });

    dbg!(&variant);

    let variant_blocks = variant
        .map(|variant| variant.blocks.clone())
        .unwrap_or_default();

    dbg!(&template_blocks, &variant_blocks);

    let mut blocks = vec![];
    blocks.extend(template_blocks);
    blocks.extend(variant_blocks);

    let mut template_for_preview = template.clone();

    template_for_preview.blocks = blocks;

    dbg!(&template_for_preview);

    let conversation: Conversation = Conversation::from_template(
        &template_for_preview,
        None,
        assistant_persona_from_id,
        user_persona_from_id,
    );

    Json(conversation)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartConversationQuery {
    variant_id: Option<String>,
}

async fn start_conversation(
    State(state): State<AsyncAppState>,
    Path(template_id): Path<String>,
    Query(query): Query<StartConversationQuery>,
) -> Json<Conversation> {
    let state = state.clone();
    let mut state = state.lock().await;

    let mut template = state
        .conversation_templates
        .iter()
        .find(|x| x.id == template_id)
        .cloned()
        .expect("should have template by id");

    let variant = query.variant_id.and_then(|variant_id| {
        template
            .variants
            .iter()
            .find(|variant| variant.id == variant_id)
    });

    dbg!("start_conversation", &template, &variant);

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

    if let Some(variant) = variant {
        template.blocks.extend(variant.blocks.clone());
    }

    let mut conversation: Conversation = Conversation::from_template(
        &template,
        None,
        assistant_persona_from_id,
        user_persona_from_id,
    );

    if let Some(variant) = variant {
        if let Some(title) = conversation.title.as_mut() {
            *title = format!("{}: {}", title, variant.title)
        }
    }

    dbg!("start_conversation", &conversation);

    state.conservations.push(conversation.clone());

    Json(conversation)
}

#[cfg(test)]
mod tests {
    use std::{collections::HashMap, sync::Arc};

    use axum::{
        Json,
        extract::{Path, Query, State},
    };
    use tokio::sync::Mutex;
    use types::{
        conversation::Conversation,
        message::{Message, Role},
        persona::Persona,
        templates::{
            ConversationTemplate, TemplateVariant, blocks::TemplateBlock, personas::TemplatePersona,
        },
    };

    use crate::{
        app_state::AppState,
        routes::templates_routes::{PreviewQueryParams, preview_conversation},
    };

    #[tokio::test]
    async fn preview_conversation_with_empty_template() {
        let test_assistant = Persona::new("Test Assisant", None);
        let test_user = Persona::new("Test User", None);

        let test_template = ConversationTemplate {
            id: "expected-template-id".to_string(),
            title: None,
            assistant_persona: Some(TemplatePersona::Id(test_assistant.id.clone())),
            user_persona: Some(TemplatePersona::Id(test_user.id.clone())),
            blocks: vec![],
            insertable_system_prompts: vec![],
            variants: vec![],
            active_variant: None,
        };

        let mut state = AppState::default();

        state.personass.push(test_assistant.clone());
        state.personass.push(test_user.clone());
        state.conversation_templates.push(test_template.clone());

        let async_state = Arc::new(Mutex::new(state));

        let Json(conversation) = preview_conversation(
            State(async_state),
            Path("expected-template-id".to_string()),
            Query(PreviewQueryParams {
                at: None,
                variant_id: None,
            }),
        )
        .await;

        pretty_assertions::assert_eq!(
            Conversation::builder()
                .id(conversation.id.clone())
                .maybe_title(conversation.title.clone())
                .template_id("expected-template-id".to_string())
                .assistant_persona(test_assistant)
                .user_persona(test_user)
                .messages(vec![])
                .variables(HashMap::default())
                .insertable_system_prompts(vec![])
                .build(),
            conversation
        )
    }

    #[tokio::test]
    async fn preview_conversation_with_variant() {
        let test_assistant = Persona::new("Test Assisant", None);
        let test_user = Persona::new("Test User", None);

        let test_template = ConversationTemplate {
            id: "expected-template-id".to_string(),
            title: None,
            assistant_persona: Some(TemplatePersona::Id(test_assistant.id.clone())),
            user_persona: Some(TemplatePersona::Id(test_user.id.clone())),
            blocks: vec![
                TemplateBlock::message(Role::System, "Example system message"),
                TemplateBlock::message(Role::Assistant, "How can I help today?"),
            ],
            insertable_system_prompts: vec![],
            variants: vec![
                TemplateVariant::builder()
                    .id("expected-variant-id".to_string())
                    .title("Expected Variant Title".to_string())
                    .blocks(vec![TemplateBlock::message(
                        Role::User,
                        "What's a healthy snack?",
                    )])
                    .insertable_system_prompts(vec![])
                    .build(),
            ],
            active_variant: Some("expected-variant-id".to_string()),
        };

        let mut state = AppState::default();

        state.personass.push(test_assistant.clone());
        state.personass.push(test_user.clone());
        state.conversation_templates.push(test_template.clone());

        let Json(conversation) = preview_conversation(
            State(Arc::new(Mutex::new(state))),
            Path("expected-template-id".to_string()),
            Query(PreviewQueryParams {
                at: Some(2),
                variant_id: Some("expected-variant-id".to_string()),
            }),
        )
        .await;

        pretty_assertions::assert_eq!(
            Conversation::builder()
                .id(conversation.id.clone())
                .maybe_title(conversation.title.clone())
                .template_id("expected-template-id".to_string())
                .assistant_persona(test_assistant)
                .user_persona(test_user)
                .messages(vec![
                    Message::builder()
                        .role(Role::System)
                        .content("Example system message".to_string())
                        .build(),
                    Message::builder()
                        .role(Role::Assistant)
                        .content("How can I help today?".to_string())
                        .build(),
                    Message::builder()
                        .role(Role::User)
                        .content("What's a healthy snack?".to_string())
                        .build()
                ])
                .variables(HashMap::default())
                .insertable_system_prompts(vec![])
                .build(),
            conversation
        )
    }
}
