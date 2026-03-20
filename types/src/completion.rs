use async_openai::types::chat::{
    ChatCompletionRequestAssistantMessage, ChatCompletionRequestAssistantMessageContent,
    ChatCompletionRequestMessage, ChatCompletionRequestSystemMessage,
    ChatCompletionRequestUserMessage,
};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::message::{Message, Role};

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
pub struct ChatCompletionRequestBody {
    pub conversation_id: String,
    pub prompt: String,
    pub settings: CompletionSettings,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
pub struct CompletionRequestBody {
    pub prompt: String,
    pub settings: CompletionSettings,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
pub struct RegenerateResponseRequestBody {
    pub conversation_id: String,
    pub message_index: usize,
    pub guidance_prompt: Option<String>,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
pub struct CompletionSettings {
    /// The maximum number of [tokens](https://platform.openai.com/tokenizer) that can be generated in the completion.
    ///
    /// The token count of your prompt plus `max_tokens` cannot exceed the model's context length. [Example Python code](https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken) for counting tokens.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,

    /// What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
    ///
    /// We generally recommend altering this or `top_p` but not both.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>, // min: 0, max: 2, default: 1,

    /// An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
    ///
    ///  We generally recommend altering this or `temperature` but not both.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>, // min: 0, max: 1, default: 1

    /// Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    ///
    /// [See more information about frequency and presence penalties.](https://platform.openai.com/docs/guides/text-generation/parameter-details)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub presence_penalty: Option<f32>, // min: -2.0, max: 2.0, default 0

    /// Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
    ///
    /// [See more information about frequency and presence penalties.](https://platform.openai.com/docs/guides/text-generation/parameter-details)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frequency_penalty: Option<f32>, // min: -2.0, max: 2.0, default: 0
}

impl TryFrom<Message> for ChatCompletionRequestMessage {
    type Error = &'static str;

    fn try_from(value: Message) -> Result<Self, Self::Error> {
        match value.role {
            Role::System => Ok(ChatCompletionRequestSystemMessage {
                content: value.content.into(),
                name: None,
            }
            .into()),

            Role::User => Ok(ChatCompletionRequestUserMessage {
                content: value.content.into(),
                name: None,
            }
            .into()),

            Role::Assistant => Ok(ChatCompletionRequestAssistantMessage {
                content: Some(ChatCompletionRequestAssistantMessageContent::Text(
                    value.content,
                )),
                name: None,
                tool_calls: None,
                refusal: None,
                audio: None,
                #[allow(deprecated)]
                function_call: None,
            }
            .into()),
        }
    }
}
