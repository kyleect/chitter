use std::{path::PathBuf, sync::Arc, vec};

use async_openai::{Client, config::OpenAIConfig};
use bon::Builder;
use sqlx::{Pool, Sqlite};
use tokio::sync::{Mutex, mpsc::UnboundedSender};
use types::{
    conversation::Conversation,
    message::Role,
    persona::Persona,
    settings::{AppSettings, ConversationSettings, LLMConnection, LLMParameters},
    templates::{
        ConversationTemplate, TemplateVariant, blocks::TemplateBlock, personas::TemplatePersona,
    },
};

#[derive(Clone, Debug, Builder)]
pub struct AppState {
    pub home_dir: Option<PathBuf>,
    pub db: Option<Pool<Sqlite>>,
    pub db_is_encrypted: bool,
    pub tx: Option<Arc<Mutex<UnboundedSender<String>>>>,
    pub llm: Option<Client<OpenAIConfig>>,
    pub conversation_templates: Vec<ConversationTemplate>,
    pub conservations: Vec<Conversation>,
    pub personass: Vec<Persona>,
    pub settings: AppSettings,
    pub insertable_system_prompts: Vec<(String, String)>,
}

impl AppState {
    pub fn new(home_dir: Option<PathBuf>) -> Self {
        Self {
            home_dir,
            db: None,
            db_is_encrypted: false,
            tx: None,
            llm: None,
            conversation_templates: vec![],
            conservations: vec![],
            personass: vec![],
            settings: AppSettings::default(),
            insertable_system_prompts: vec![],
        }
    }
    pub fn reset(&mut self) {}

    pub fn set_db(&mut self, db: Option<Pool<Sqlite>>) {
        self.db = db;
    }
}

impl Default for AppState {
    fn default() -> Self {
        let user_persona = Persona::new("User", Some("The user being responded to"));
        let assistant_persona = Persona::new(
            "AI Assistant",
            Some("The default AI assistant in the Chitter app."),
        );

        let template_1 = {
            let mut template = ConversationTemplate::new(Some("Example".to_string()));

            template.assistant_persona = Some(TemplatePersona::Id(assistant_persona.id.clone()));

            template.user_persona = Some(TemplatePersona::Id(user_persona.id.clone()));

            template.insertable_system_prompts.push((
                "test".to_string(),
                "A test insertable system prompt".to_string(),
            ));

            template.insertable_system_prompts.push((
                "test2".to_string(),
                "Another test insertable system prompt".to_string(),
            ));

            let summarize_as_list_var = template.set_var("summaryAsList", true.into());

            template.add_system_message("You are a helpful AI assistant.");

            template.add_assistant_message("Hello, I'm here to help! What can I do for you today?");

            template.inner_thoughts_message("I wonder what the task is.");

            template.add_user_message(
            "I need you to summarize some text for me, highlighting the most important details.",
        );

            template.ooc_message("Only respond with the summary of the text.");

            template.if_eq(&summarize_as_list_var, &true.into());

            template.ooc_message("Format the summary as a bulleted list");

            template.end_if();

            template.add_assistant_message("Send the text and I'll respond with a summary.");

            template
        };

        let template_2 = {
            let mut template = ConversationTemplate::new(Some("Joke".to_string()));

            template.assistant_persona = Some(TemplatePersona::Id(assistant_persona.id.clone()));

            template.user_persona = Some(TemplatePersona::Id(user_persona.id.clone()));

            template
                .add_assistant_message("Hello! Give me a topic and I'll tell you a funny joke.");

            template.variants.push(TemplateVariant::new(
                "Halloween Joke",
                vec![TemplateBlock::message(Role::User, "Halloween")],
                vec![],
            ));

            template.variants.push(TemplateVariant::new(
                "Programming Joke",
                vec![TemplateBlock::message(Role::User, "Programming")],
                vec![],
            ));

            template
        };

        let template_3 = {
            let mut template = ConversationTemplate::new(Some("Prefilled User Reply".to_string()));

            template.assistant_persona = Some(Persona::new("Assistant", None).into());

            template.user_persona = Some(Persona::new("User", None).into());

            template.add_user_message("Example of a prefilled user reply on conversation start");

            template
        };

        let personas_insertable = "
You are {{CHAR}}. I am {{USER}}.

---
{{CHAR}}'s Description:

{{CHAR_DESCRIPTION}}
---
{{USER}}'s Description:

{{USER_DESCRIPTION}}
---

    "
        .trim();

        let text_message_insertable = "
This is a text message conversation.
    "
        .trim();

        let in_person_insertable = "
This is an in person conversation.
    "
        .trim();

        let video_call_insertable = "
This is video call.
    "
        .trim();

        let app_settings = AppSettings::builder()
        .default_assistant_persona_id(assistant_persona.id.clone())
        .default_user_persona_id(user_persona.id.clone())
        .connection(
            LLMConnection::builder()
                .maybe_api_key(None)
                .maybe_url(Some("http://localhost:8080/v1".to_string()))
                .build(),
        )
        .params(
            LLMParameters::builder()
                .temperature(0.8f32)
                .system_prompt("You are a helpful AI assistant.".to_string())
                .max_tokens(500)
                .top_k(60)
                .top_p(0.95)
                .min_p(0.05)
                .build(),
        )
        .conversation_settings(ConversationSettings {
            add_detail_prompt: Some(
                "Rewrite the following text to add length and detail while maintaining the original meaning of the text. Respond only with the rewritten text.\n\nText to rewrite:\n\n{{INPUT}}"
                    .to_string(),
            ),
            rename_conversation_prompt: Some("Write a short title that summarizes the following text:\n\n{{INPUT}}".to_string())
        })
        .build();

        let client = Client::with_config(
            OpenAIConfig::new().with_api_base(
                &app_settings
                    .connection
                    .clone()
                    .url
                    .expect("should have url set in settings above"),
            ),
        );

        AppState::builder()
            .maybe_home_dir(None)
            .maybe_db(None)
            .db_is_encrypted(true)
            .maybe_llm(Some(client))
            .conservations(vec![])
            .conversation_templates(vec![
                template_1.clone(),
                template_2.clone(),
                template_3.clone(),
            ])
            .personass(vec![assistant_persona, user_persona])
            .settings(app_settings)
            .insertable_system_prompts(vec![
                ("Personas".to_string(), personas_insertable.to_string()),
                (
                    "Type: Text Message".to_string(),
                    text_message_insertable.to_string(),
                ),
                (
                    "Type: In Person Conversation".to_string(),
                    in_person_insertable.to_string(),
                ),
                (
                    "Type: Video Call".to_string(),
                    video_call_insertable.to_string(),
                ),
            ])
            .build()
    }
}

pub type AsyncAppState = Arc<Mutex<AppState>>;
