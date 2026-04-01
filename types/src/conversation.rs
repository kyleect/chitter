use std::collections::HashMap;

use bon::Builder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    message::{Message, Role},
    persona::Persona,
    templates::{
        ConversationTemplate,
        blocks::TemplateBlock,
        personas::TemplatePersona,
        variables::{VariableKey, VariableValue},
    },
};

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default, Builder)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct Conversation {
    pub id: String,
    pub title: Option<String>,
    pub template_id: String,
    pub assistant_persona: Persona,
    pub user_persona: Persona,
    pub messages: Vec<Message>,
    pub variables: HashMap<VariableKey, VariableValue>,
    pub insertable_system_prompts: Vec<(String, String)>,
}

impl Conversation {
    pub fn fork(&self) -> Self {
        let mut new = self.clone();

        new.id = uuid::Uuid::new_v4().to_string();

        new
    }

    pub fn from_template(
        template: &ConversationTemplate,
        _variant_id: Option<String>,
        assistant_persona_from_id: Option<&Persona>,
        user_persona_from_id: Option<&Persona>,
        first_message_index: Option<usize>,
    ) -> Self {
        let mut messages: Vec<Message> = vec![];
        let mut variables: HashMap<VariableKey, VariableValue> = HashMap::new();
        let mut in_if_eq = false;
        let mut if_eq_result: Option<bool> = None;

        let mut blocks = vec![];

        blocks.extend(template.blocks.clone());

        for item in template.blocks.iter() {
            if let Some(result) = if_eq_result
                && in_if_eq
            {
                if !result {
                    continue;
                }
            }

            match item {
                TemplateBlock::Message(next_message) => {
                    messages.push(next_message.clone());
                }
                TemplateBlock::FirstAssistantMessage => {
                    if let Some(index) = first_message_index {
                        let first_message = assistant_persona_from_id
                            .and_then(|persona| persona.first_messages.get(index));

                        if let Some(first_message) = first_message {
                            messages.push(
                                Message::builder()
                                    .role(Role::Assistant)
                                    .content(first_message.clone())
                                    .build(),
                            );
                        }
                    }
                }
                TemplateBlock::OOC(prompt) => {
                    if let Some(draft_message) = messages.last_mut() {
                        draft_message
                            .content
                            .push_str(&format!("\n((OOC: {prompt}))\n\n"));
                    }
                }
                TemplateBlock::InnerThoughts(prompt) => {
                    if let Some(draft_message) = messages.last_mut() {
                        draft_message
                            .content
                            .push_str(&format!("\n((Inner Thoughts: {prompt}))\n\n"));
                    }
                }
                TemplateBlock::SetVar(key, value) => {
                    variables.insert(key.clone(), value.clone());
                }
                TemplateBlock::IfEq(key, expected_value) => {
                    in_if_eq = true;

                    let maybe_value = variables.get(key);

                    let result = match maybe_value {
                        Some(value) => value == expected_value,
                        None => false,
                    };

                    if_eq_result = Some(result)
                }
                TemplateBlock::EndIf => {
                    in_if_eq = false;
                }
            }
        }

        let assistant_persona = template
            .assistant_persona
            .clone()
            .and_then(
                |template_assistant_persona| match template_assistant_persona {
                    TemplatePersona::Id(_) => match assistant_persona_from_id {
                        Some(persona) => Some(persona.clone()),
                        None => {
                            panic!("No assistant persona")
                        }
                    },
                    TemplatePersona::Embedded(persona) => Some(persona.clone()),
                },
            )
            .expect("should have an assistant persona attached to conversation");

        let user_persona = template
            .user_persona
            .clone()
            .and_then(|template_user_persona| match template_user_persona {
                TemplatePersona::Id(_) => match user_persona_from_id {
                    Some(persona) => Some(persona.clone()),
                    None => {
                        panic!("No user persona")
                    }
                },
                TemplatePersona::Embedded(persona) => Some(persona.clone()),
            })
            .expect("should have an user persona attached to conversation");

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: template.title.clone(),
            template_id: template.id.clone(),
            assistant_persona,
            user_persona,
            messages,
            variables,
            insertable_system_prompts: template.insertable_system_prompts.clone(),
        }
    }
}

#[cfg(test)]
mod conversation_tests {
    use crate::message::Role;

    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test() {
        let mut assistant: Persona = Persona::default();
        assistant.id = "assistantId".to_string();

        let mut user: Persona = Persona::default();
        user.id = "userId".to_string();

        let mut template = ConversationTemplate::new(None);

        template.assistant_persona = Some(TemplatePersona::Id(assistant.id.clone()));
        template.user_persona = Some(TemplatePersona::Id(user.id.clone()));

        template
            .insertable_system_prompts
            .push(("Test".to_string(), "Test Message".to_string()));

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

        let mut conservation: Conversation = Conversation::from_template(
            &template,
            Some("expected-variant-id".to_string()),
            Some(&assistant),
            Some(&user),
            None,
        );

        conservation.id = "expectedConservationId".to_string();

        assert_eq!(
            Conversation {
                id: "expectedConservationId".to_string(),
                title: template.title,
                template_id: template.id,
                assistant_persona: assistant,
                user_persona : user,
                messages: vec![
                    Message {
                        role: Role::System,
                        content: "You are a helpful AI assistant.".to_string()
                    },
                    Message {
                        role: Role::Assistant,
                        content: "Hello, I'm here to help! What can I do for you today?\n((Inner Thoughts: I wonder what the task is.))\n\n".to_string()
                    },
                    Message {
                        role: Role::User,
                        content: "I need you to summarize some text for me, highlighting the most important details.\n((OOC: Only respond with the summary of the text.))\n\n".to_string()
                    }
                ],
                variables: HashMap::from([(summarize_as_list_var, false.into())]),
                insertable_system_prompts: vec![("Test".to_string(), "Test Message".to_string())]
            },
            conservation
        );
    }
}
