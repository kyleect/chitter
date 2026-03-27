use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterCardV2 {
    pub spec: String, // "chara_card_v2"
    pub spec_version: String,
    pub data: CharacterDataV2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterDataV2 {
    pub name: String,
    pub description: String,
    pub personality: String,
    pub scenario: String,
    pub first_mes: String,
    pub mes_example: String,

    #[serde(default)]
    pub creator_notes: String,

    #[serde(default)]
    pub system_prompt: String,

    #[serde(default)]
    pub post_history_instructions: String,

    #[serde(default)]
    pub tags: Vec<String>,
}
