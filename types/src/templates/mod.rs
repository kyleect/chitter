use bon::Builder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    message::{Message, Role},
    templates::{
        blocks::TemplateBlock,
        personas::TemplatePersona,
        variables::{VariableKey, VariableValue},
    },
};

pub mod blocks;
pub mod personas;
pub mod variables;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Builder)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ConversationTemplate {
    pub id: String,
    pub title: Option<String>,
    pub assistant_persona: Option<TemplatePersona>,
    pub user_persona: Option<TemplatePersona>,
    pub blocks: Vec<TemplateBlock>,
    pub insertable_system_prompts: Vec<(String, String)>,
    pub variants: Vec<TemplateVariant>,
    pub active_variant: Option<String>,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Builder)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TemplateVariant {
    pub id: String,
    pub title: String,
    pub blocks: Vec<TemplateBlock>,
    pub insertable_system_prompts: Vec<(String, String)>,
}

impl TemplateVariant {
    pub fn new(
        title: &str,
        blocks: Vec<TemplateBlock>,
        insertable_system_prompts: Vec<(String, String)>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            blocks,
            insertable_system_prompts,
        }
    }
}

impl ConversationTemplate {
    pub fn new(title: Option<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            assistant_persona: None,
            user_persona: None,
            blocks: vec![],
            insertable_system_prompts: Default::default(),
            variants: vec![],
            active_variant: None,
        }
    }

    pub fn fork(&self) -> Self {
        let mut new = self.clone();

        new.id = uuid::Uuid::new_v4().to_string();

        new
    }

    pub fn if_eq(self: &mut Self, var_name: &VariableKey, expected: &VariableValue) {
        self.blocks
            .push(TemplateBlock::IfEq(var_name.clone(), expected.clone()));
    }

    pub fn end_if(self: &mut Self) {
        self.blocks.push(TemplateBlock::EndIf);
    }

    pub fn set_var(self: &mut Self, key: &str, value: VariableValue) -> VariableKey {
        let var_key = VariableKey(key.to_string());

        self.blocks
            .push(TemplateBlock::SetVar(var_key.clone(), value));

        var_key
    }

    pub fn get_var(self: &Self, key: &str) -> Option<&VariableValue> {
        let var_found = self
            .blocks
            .iter()
            .filter(|item| {
                if let TemplateBlock::SetVar(set_key, _) = item
                    && set_key.0 == key
                {
                    return true;
                } else {
                    return false;
                }
            })
            .last()
            .and_then(|item| match item {
                TemplateBlock::SetVar(_, variable_value) => Some(variable_value),
                _ => None,
            });

        return var_found;
    }

    pub fn add_message(self: &mut Self, message: Message) {
        self.blocks.push(TemplateBlock::Message(message));
    }

    pub fn add_system_message(self: &mut Self, message: &str) {
        self.blocks.push(TemplateBlock::Message(Message {
            role: Role::System,
            content: message.to_string(),
        }));
    }

    pub fn add_user_message(self: &mut Self, message: &str) {
        self.blocks.push(TemplateBlock::Message(Message {
            role: Role::User,
            content: message.to_string(),
        }));
    }

    pub fn ooc_message(self: &mut Self, message: &str) {
        self.blocks.push(TemplateBlock::ooc(message));
    }

    pub fn inner_thoughts_message(self: &mut Self, message: &str) {
        self.blocks.push(TemplateBlock::inner_thoughts(message));
    }

    pub fn add_assistant_message(self: &mut Self, message: &str) {
        self.blocks.push(TemplateBlock::Message(Message {
            role: Role::Assistant,
            content: message.to_string(),
        }));
    }
}

#[cfg(test)]
mod conversation_template_tests {

    use crate::{message::Role, persona::Persona, templates::variables::VariableValue};

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
                blocks: vec![
                    TemplateBlock::set_var("summaryAsList", VariableValue::Boolean(true)),
                    TemplateBlock::message(Role::System, "You are a helpful AI assistant."),
                    TemplateBlock::message(
                        Role::Assistant,
                        "Hello, I'm here to help! What can I do for you today?"
                    ),
                    TemplateBlock::inner_thoughts("I wonder what the task is."),
                    TemplateBlock::message(
                        Role::User,
                        "I need you to summarize some text for me, highlighting the most important details."
                    ),
                    TemplateBlock::ooc("Only respond with the summary of the text."),
                    TemplateBlock::IfEq(summarize_as_list_var.clone(), true.into()),
                    TemplateBlock::ooc("Format the summary as a bulleted list"),
                    TemplateBlock::EndIf
                ],
                insertable_system_prompts: Default::default(),
                variants: vec![],
                active_variant: None
            },
            conversation
        );
    }
}
