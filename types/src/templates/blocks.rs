use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    message::{Message, Role},
    templates::variables::{VariableKey, VariableValue},
};

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum TemplateBlock {
    Message(Message),
    SetVar(VariableKey, VariableValue),
    OOC(String),
    InnerThoughts(String),
    IfEq(VariableKey, VariableValue),
    EndIf,
}

impl TemplateBlock {
    pub fn message(role: Role, message: &str) -> Self {
        TemplateBlock::Message(
            Message::builder()
                .role(role)
                .content(message.to_string())
                .build(),
        )
    }

    pub fn set_var(key: &str, value: VariableValue) -> Self {
        TemplateBlock::SetVar(VariableKey(key.to_string()), value)
    }

    pub fn ooc(prompt: &str) -> Self {
        TemplateBlock::OOC(prompt.to_string())
    }

    pub fn inner_thoughts(thoughts: &str) -> Self {
        TemplateBlock::InnerThoughts(thoughts.to_string())
    }
}
