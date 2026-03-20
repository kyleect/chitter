use bon::Builder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default, Builder)]
#[ts(export)]
pub struct AppSettings {
    pub default_assistant_persona_id: Option<String>,
    pub default_user_persona_id: Option<String>,
    pub connection: LLMConnection,
    pub params: LLMParameters,
    pub conversation_settings: ConversationSettings,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default, Builder)]
#[ts(export)]
pub struct ConversationSettings {
    pub add_detail_prompt: Option<String>,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default, Builder)]
#[ts(export)]
pub struct LLMConnection {
    pub url: Option<String>,
    pub api_key: Option<String>,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default, Builder)]
#[ts(export)]
pub struct LLMParameters {
    pub system_prompt: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub top_k: Option<usize>,
    pub top_p: Option<f32>,
    pub min_p: Option<f32>,
}
