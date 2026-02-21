use std::{collections::HashMap, fmt::Display, hash::Hash};

use bon::Builder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
pub struct Persona {
    pub id: String,
    pub name: String,
}

impl Persona {
    pub fn new(name: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
        }
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "kind")]
#[ts(export)]
pub enum Role {
    System,
    User,
    Assistant,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Builder)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "kind")]
#[ts(export)]
pub struct Message {
    pub role: Role,
    pub message: Option<String>,
}

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

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ConversationTemplate {
    pub id: String,
    pub assistant_persona_id: String,
    pub user_persona_id: String,
    pub items: Vec<ConversationItem>,
}

impl ConversationTemplate {
    pub fn new(assistant: Persona, user: Persona) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            assistant_persona_id: assistant.id,
            user_persona_id: user.id,
            items: vec![],
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

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct Conversation {
    pub id: String,
    pub template_id: String,
    pub assistant_persona_id: String,
    pub user_persona_id: String,
    pub messages: Vec<Message>,
    pub variables: HashMap<VariableKey, VariableValue>,
}

impl From<ConversationTemplate> for Conversation {
    fn from(template: ConversationTemplate) -> Self {
        let mut messages: Vec<Message> = vec![];
        let mut variables: HashMap<VariableKey, VariableValue> = HashMap::new();
        let mut in_if_eq = false;
        let mut if_eq_result: Option<bool> = None;

        for item in template.items.iter() {
            if let Some(result) = if_eq_result
                && in_if_eq
            {
                if !result {
                    continue;
                }
            }

            match item {
                ConversationItem::Message(next_message) => {
                    if let Some(existing_draft_message) = &mut messages.last_mut() {
                        if existing_draft_message.role == next_message.role {
                            if let Some(message_string) = &mut existing_draft_message.message {
                                message_string.push_str(
                                    &next_message.message.clone().unwrap_or("".to_string()),
                                );
                            }
                        } else {
                            messages.push(next_message.clone());
                        }
                    } else {
                        messages.push(next_message.clone());
                    }
                }
                ConversationItem::OOC(prompt) => {
                    if let Some(draft_message) = &mut messages.last_mut() {
                        if let Some(draft_message_text) = &mut draft_message.message {
                            draft_message_text.push_str(&format!("\n((OOC: {prompt}))\n\n"));
                        }
                    }
                }
                ConversationItem::InnerThoughts(prompt) => {
                    if let Some(draft_message) = messages.last_mut() {
                        if let Some(draft_message_text) = &mut draft_message.message {
                            draft_message_text
                                .push_str(&format!("\n((Inner Thoughts: {prompt}))\n\n"));
                        }
                    }
                }
                ConversationItem::SetVar(key, value) => {
                    variables.insert(key.clone(), value.clone());
                }
                ConversationItem::IfEq(key, expected_value) => {
                    in_if_eq = true;

                    let maybe_value = variables.get(key);

                    let result = match maybe_value {
                        Some(value) => value == expected_value,
                        None => false,
                    };

                    if_eq_result = Some(result)
                }
                ConversationItem::EndIf => {
                    in_if_eq = false;
                }
            }
        }

        dbg!(&variables);

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            template_id: template.id.clone(),
            assistant_persona_id: template.assistant_persona_id,
            user_persona_id: template.user_persona_id,
            messages,
            variables,
        }
    }
}

#[cfg(test)]
mod conversation_tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test() {
        let mut assistant: Persona = Persona::default();
        assistant.id = "assistantId".to_string();

        let mut user: Persona = Persona::default();
        user.id = "userId".to_string();

        let mut template = ConversationTemplate::new(assistant.clone(), user.clone());

        template.id = "expectedTemplateId".to_string();

        let summarize_as_list_var = template.set_var("summaryAsList", false.into());

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

        let mut conservation: Conversation = template.clone().into();

        conservation.id = "expectedConservationId".to_string();

        assert_eq!(
            Conversation {
                id: "expectedConservationId".to_string(),
                template_id: template.id,
                assistant_persona_id: assistant.id,
                user_persona_id : user.id,
                messages: vec![
                    Message {
                        role: Role::System,
                        message: Some("You are a helpful AI assistant.".to_string())
                    },
                    Message {
                        role: Role::Assistant,
                        message: Some(
                            "Hello, I'm here to help! What can I do for you today?\n((Inner Thoughts: I wonder what the task is.))\n\n".to_string()
                        )
                    },
                    Message {
                        role: Role::User,
                        message: Some(
                            "I need you to summarize some text for me, highlighting the most important details.\n((OOC: Only respond with the summary of the text.))\n\n".to_string()
                        )
                    }
                ],
                variables: HashMap::from([(summarize_as_list_var, false.into())])
            },
            conservation
        );
    }
}

#[cfg(test)]
mod conversation_template_tests {

    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_basic_conversation() {
        let mut assistant: Persona = Persona::default();
        assistant.id = "assistantId".to_string();

        let mut user: Persona = Persona::default();
        user.id = "userId".to_string();

        let mut conversation = ConversationTemplate::new(assistant.clone(), user.clone());

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
                assistant_persona_id: assistant.id,
                user_persona_id : user.id,
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
                ]
            },
            conversation
        );
    }
}
