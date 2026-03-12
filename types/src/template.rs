use std::fmt::Display;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    message::{Message, Role},
    persona::Persona,
};

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum ConversationItem {
    Message(Message),
    SetVar(VariableKey, VariableValue),
    OOC(String),
    InnerThoughts(String),
    IfEq(VariableKey, VariableValue),
    EndIf,
}

impl ConversationItem {
    pub fn message(role: Role, message: Option<String>) -> Self {
        ConversationItem::Message(Message::builder().role(role).maybe_message(message).build())
    }

    pub fn set_var(key: &str, value: VariableValue) -> Self {
        ConversationItem::SetVar(VariableKey(key.to_string()), value)
    }

    pub fn ooc(prompt: &str) -> Self {
        ConversationItem::OOC(prompt.to_string())
    }

    pub fn inner_thoughts(thoughts: &str) -> Self {
        ConversationItem::InnerThoughts(thoughts.to_string())
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum Conditional {
    VarEq(String, String),
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum VariableValue {
    String(String),
    Boolean(bool),
    Number(f64),
}

impl Display for VariableValue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VariableValue::String(value) => write!(f, "{}", value),
            VariableValue::Boolean(value) => write!(f, "{}", value),
            VariableValue::Number(value) => write!(f, "{}", value),
        }
    }
}

impl From<String> for VariableValue {
    fn from(value: String) -> Self {
        Self::String(value)
    }
}

impl From<bool> for VariableValue {
    fn from(value: bool) -> Self {
        Self::Boolean(value)
    }
}

impl From<f64> for VariableValue {
    fn from(value: f64) -> Self {
        Self::Number(value)
    }
}

#[derive(TS, Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct VariableKey(pub String);

#[derive(TS, Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
#[ts(export)]
pub enum TemplatePersona {
    Id(String),
    Embedded(Persona),
}

impl From<&str> for TemplatePersona {
    fn from(value: &str) -> Self {
        Self::Id(value.to_string())
    }
}

impl From<Persona> for TemplatePersona {
    fn from(value: Persona) -> Self {
        Self::Embedded(value.clone())
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ConversationTemplate {
    pub id: String,
    pub title: Option<String>,
    pub assistant_persona: Option<TemplatePersona>,
    pub user_persona: Option<TemplatePersona>,
    pub items: Vec<ConversationItem>,
    pub insertable_system_prompts: Vec<(String, String)>,
}

impl ConversationTemplate {
    pub fn new(title: Option<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            assistant_persona: None,
            user_persona: None,
            items: vec![],
            insertable_system_prompts: Default::default(),
        }
    }

    pub fn if_eq(self: &mut Self, var_name: &VariableKey, expected: &VariableValue) {
        self.items
            .push(ConversationItem::IfEq(var_name.clone(), expected.clone()));
    }

    pub fn end_if(self: &mut Self) {
        self.items.push(ConversationItem::EndIf);
    }

    pub fn set_var(self: &mut Self, key: &str, value: VariableValue) -> VariableKey {
        let var_key = VariableKey(key.to_string());

        self.items
            .push(ConversationItem::SetVar(var_key.clone(), value));

        var_key
    }

    pub fn get_var(self: &Self, key: &str) -> Option<&VariableValue> {
        let var_found = self
            .items
            .iter()
            .filter(|item| {
                if let ConversationItem::SetVar(set_key, _) = item
                    && set_key.0 == key
                {
                    return true;
                } else {
                    return false;
                }
            })
            .last()
            .and_then(|item| match item {
                ConversationItem::SetVar(_, variable_value) => Some(variable_value),
                _ => None,
            });

        return var_found;
    }

    pub fn add_message(self: &mut Self, message: Message) {
        self.items.push(ConversationItem::Message(message));
    }

    pub fn add_system_message(self: &mut Self, message: &str) {
        self.items.push(ConversationItem::Message(Message {
            role: Role::System,
            message: Some(message.to_string()),
        }));
    }

    pub fn add_user_message(self: &mut Self, message: &str) {
        self.items.push(ConversationItem::Message(Message {
            role: Role::User,
            message: Some(message.to_string()),
        }));
    }

    pub fn ooc_message(self: &mut Self, message: &str) {
        self.items.push(ConversationItem::ooc(message));
    }

    pub fn inner_thoughts_message(self: &mut Self, message: &str) {
        self.items.push(ConversationItem::inner_thoughts(message));
    }

    pub fn add_assistant_message(self: &mut Self, message: &str) {
        self.items.push(ConversationItem::Message(Message {
            role: Role::Assistant,
            message: Some(message.to_string()),
        }));
    }
}

#[cfg(test)]
mod conversation_template_tests {

    use crate::message::Role;

    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_basic_conversation() {
        let mut assistant: Persona = Persona::default();
        assistant.id = "assistantId".to_string();

        let mut user: Persona = Persona::default();
        user.id = "userId".to_string();

        let mut conversation = ConversationTemplate::new(None);

        let summarize_as_list_var = conversation.set_var("summaryAsList", true.into());

        conversation.add_system_message("You are a helpful AI assistant.");

        conversation.add_assistant_message("Hello, I'm here to help! What can I do for you today?");

        conversation.inner_thoughts_message("I wonder what the task is.");

        conversation.add_user_message(
            "I need you to summarize some text for me, highlighting the most important details.",
        );

        conversation.ooc_message("Only respond with the summary of the text.");

        conversation.if_eq(&summarize_as_list_var, &true.into());

        conversation.ooc_message("Format the summary as a bulleted list");

        conversation.end_if();

        assert_eq!(
            ConversationTemplate {
                id: "".to_string(),
                title: None,
                assistant_persona: Some(TemplatePersona::Id(assistant.id.clone())),
                user_persona: Some(TemplatePersona::Id(user.id.clone())),
                items: vec![
                    ConversationItem::set_var("summaryAsList", VariableValue::Boolean(true)),
                    ConversationItem::message(
                        Role::System,
                        Some("You are a helpful AI assistant.".to_string())
                    ),
                    ConversationItem::message(
                        Role::Assistant,
                        Some("Hello, I'm here to help! What can I do for you today?".to_string())
                    ),
                    ConversationItem::inner_thoughts("I wonder what the task is."),
                    ConversationItem::message(
                        Role::User,
                        Some("I need you to summarize some text for me, highlighting the most important details.".to_string())
                    ),
                    ConversationItem::ooc("Only respond with the summary of the text."),
                    ConversationItem::IfEq(summarize_as_list_var.clone(), true.into()),
                    ConversationItem::ooc("Format the summary as a bulleted list"),
                    ConversationItem::EndIf
                ],
                insertable_system_prompts: Default::default()
            },
            conversation
        );
    }
}
