use async_openai::types::{
    chat::{ChatCompletionRequestMessage, CreateChatCompletionRequestArgs},
    completions::CreateCompletionRequestArgs,
};
use axum::{
    Router,
    response::{IntoResponse, Response},
    routing::post,
};
use hyper::StatusCode;
use serde::{Deserialize, Serialize};

use axum::{Json, extract::State};
use types::{
    completion::{
        ChatCompletionRequestBody, CompletionRequestBody, GenerateResponseRequestBody,
        RegenerateResponseRequestBody,
    },
    message::Role,
};

use crate::app_state::AsyncAppState;

pub fn completions_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/chat", post(chat_completion))
        .route("/chat/generate", post(generate_response))
        .route("/chat/regenerate", post(regenerate_response))
        .route("/text", post(completetion))
        .with_state(state)
}

#[derive(Serialize, Deserialize, Clone)]
struct CompletionResponse {
    pub response: String,
}

async fn chat_completion(
    State(state): State<AsyncAppState>,
    Json(body): Json<ChatCompletionRequestBody>,
) -> CompletionResponse {
    let state = state.clone();
    let mut state = state.lock().await;

    {
        let conversation = state
            .conservations
            .iter_mut()
            .find(|c| c.id == body.conversation_id)
            .expect(&format!(
                "should find conversation by id {}",
                body.conversation_id
            ));

        conversation.messages.push(
            types::message::Message::builder()
                .role(Role::User)
                .content(body.prompt.clone())
                .build(),
        );

        if let Some(system_message_after_prompt) = &body.system_message_after_prompt {
            conversation.messages.push(
                types::message::Message::builder()
                    .role(Role::System)
                    .content(system_message_after_prompt.clone())
                    .build(),
            );
        }
    };

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    let assistant_persona = &conversation.assistant_persona;

    let user_persona = &conversation.user_persona;

    if let Some(client) = &state.llm {
        let request = CreateChatCompletionRequestArgs::default()
            .frequency_penalty(1.0)
            .temperature(state.settings.params.temperature.clone().unwrap_or(0.8f32))
            .max_tokens(state.settings.params.max_tokens.clone().unwrap_or(500))
            .top_p(state.settings.params.top_p.clone().unwrap_or(0.95))
            .messages(
                conversation
                    .messages
                    .iter()
                    .map(|message| {
                        // Update message.message if is Some
                        let new_message_string = message
                            .content
                            .replace("{{CHAR}}", &assistant_persona.name)
                            .replace("{{CHAR_DESCRIPTION}}", &assistant_persona.description)
                            .replace("{{USER}}", &assistant_persona.name)
                            .replace("{{USER_DESCRIPTION}}", &user_persona.description);

                        let mut new_message = message.clone();

                        new_message.content = new_message_string;

                        let m: ChatCompletionRequestMessage = new_message.try_into().unwrap();

                        dbg!(&m);

                        m
                    })
                    .collect::<Vec<_>>(),
            )
            .build()
            .expect("should build chat completion request");

        dbg!(&request);

        let response = client.chat().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                (*conversation).messages.push(
                    types::message::Message::builder()
                        .role(Role::Assistant)
                        .content(first_choice.message.content.clone().unwrap_or_default())
                        .build(),
                );

                return CompletionResponse {
                    response: first_choice.message.content.clone().unwrap_or_default(),
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return CompletionResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    todo!()
}

impl IntoResponse for CompletionResponse {
    fn into_response(self) -> Response {
        (StatusCode::OK, serde_json::to_string_pretty(&self).unwrap()).into_response()
    }
}

async fn completetion(
    State(state): State<AsyncAppState>,
    Json(body): Json<CompletionRequestBody>,
) -> CompletionResponse {
    let state = state.clone();
    let state = state.lock().await;

    match &state.llm {
        Some(client) => {
            let request = CreateCompletionRequestArgs::default()
                .prompt(body.prompt)
                .max_tokens(
                    body.settings
                        .max_tokens
                        .or(state.settings.params.max_tokens)
                        .unwrap_or(400),
                )
                .temperature(
                    body.settings
                        .temperature
                        .or(state.settings.params.temperature)
                        .unwrap_or(0.8f32),
                )
                .build()
                .expect("should create completion request");

            let response = client.completions().create(request).await;

            match &response {
                Ok(response) => {
                    let first_choice = response.choices.first().unwrap();

                    return CompletionResponse {
                        response: first_choice.text.clone(),
                    };
                }
                Err(err) => {
                    let err_str = err.to_string();

                    return CompletionResponse {
                        response: err_str.clone(),
                    };
                }
            }
        }
        _ => CompletionResponse {
            response: "FALLBACK TODO!".to_string(),
        },
    }
}

#[derive(Serialize, Deserialize, Clone)]
struct GenerateResponseResponse {
    pub response: String,
}

impl IntoResponse for GenerateResponseResponse {
    fn into_response(self) -> Response {
        (StatusCode::OK, serde_json::to_string_pretty(&self).unwrap()).into_response()
    }
}

#[axum::debug_handler]
async fn generate_response(
    State(state): State<AsyncAppState>,
    Json(body): Json<GenerateResponseRequestBody>,
) -> GenerateResponseResponse {
    let state = state.clone();
    let mut state = state.lock().await;

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    let assistant_persona = &conversation.assistant_persona;

    let user_persona = &conversation.user_persona;

    if let Some(client) = &state.llm {
        let request = CreateChatCompletionRequestArgs::default()
            .frequency_penalty(1.0)
            .temperature(state.settings.params.temperature.clone().unwrap_or(0.8f32))
            .max_tokens(state.settings.params.max_tokens.clone().unwrap_or(500))
            .top_p(state.settings.params.top_p.clone().unwrap_or(0.95))
            .messages(
                conversation
                    .messages
                    .iter()
                    .map(|message| {
                        // Update message.message if is Some
                        let new_message_string = message
                            .content
                            .replace("{{CHAR}}", &assistant_persona.name)
                            .replace("{{CHAR_DESCRIPTION}}", &assistant_persona.description)
                            .replace("{{USER}}", &assistant_persona.name)
                            .replace("{{USER_DESCRIPTION}}", &user_persona.description);

                        let mut new_message = message.clone();

                        new_message.content = new_message_string;

                        let m: ChatCompletionRequestMessage = new_message.try_into().unwrap();

                        dbg!(&m);

                        m
                    })
                    .collect::<Vec<_>>(),
            )
            .build()
            .expect("should build chat completion request");

        dbg!(&request);

        let response = client.chat().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                (*conversation).messages.push(
                    types::message::Message::builder()
                        .role(Role::Assistant)
                        .content(first_choice.message.content.clone().unwrap_or_default())
                        .build(),
                );

                return GenerateResponseResponse {
                    response: first_choice.message.content.clone().unwrap_or_default(),
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return GenerateResponseResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    todo!()
}

async fn regenerate_response(
    State(state): State<AsyncAppState>,
    Json(body): Json<RegenerateResponseRequestBody>,
) -> CompletionResponse {
    let state = state.clone();

    let last_message: Option<types::message::Message>;

    {
        let mut state = state.lock().await;
        let conversation = state
            .conservations
            .iter_mut()
            .find(|c| c.id == body.conversation_id)
            .unwrap();

        // Remove the last message from conversation.messages
        last_message = (*conversation).messages.pop();
    };

    let mut state = state.lock().await;

    let conversation = state
        .conservations
        .iter()
        .find(|c| c.id == body.conversation_id)
        .unwrap();

    if let Some(client) = &state.llm {
        let mut messages = conversation.messages.clone();

        if let Some(guidance_prompt) = body.guidance_prompt {
            messages.push(
                types::message::Message::builder()
                    .role(Role::System)
                    .content(format!(
                        "
Rewrite this message, using the guidance prompt below, and use this as your response.

Guidance Prompt:

{guidance_prompt}

Messsage To Rewrite:

{}
",
                        last_message
                            .expect("there should be a last message")
                            .content
                    ))
                    .build(),
            );
        }

        let request = CreateChatCompletionRequestArgs::default()
            .temperature(state.settings.params.temperature.clone().unwrap_or(0.8f32))
            .max_tokens(state.settings.params.max_tokens.clone().unwrap_or(500))
            .top_p(state.settings.params.top_p.clone().unwrap_or(0.95))
            .messages(
                messages
                    .iter()
                    .map(|message| {
                        let m: ChatCompletionRequestMessage = message.clone().try_into().unwrap();

                        m
                    })
                    .collect::<Vec<_>>(),
            )
            .build()
            .expect("should build chat completion request");

        let response = client.chat().create(request).await;

        match &response {
            Ok(response) => {
                let first_choice = response.choices.first().unwrap();

                let conversation = state
                    .conservations
                    .iter_mut()
                    .find(|t| t.id == body.conversation_id)
                    .ok_or(StatusCode::NOT_FOUND)
                    .unwrap();

                let generated_response = first_choice.message.content.clone().unwrap_or_default();

                (*conversation).messages.push(
                    types::message::Message::builder()
                        .role(Role::Assistant)
                        .content(generated_response.clone())
                        .build(),
                );

                return CompletionResponse {
                    response: generated_response,
                };
            }
            Err(err) => {
                let err_str = err.to_string();

                dbg!(&err_str);

                return CompletionResponse {
                    response: err_str.clone(),
                };
            }
        }
    }

    todo!()
}
