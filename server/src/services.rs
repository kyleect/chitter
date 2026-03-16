pub mod broadcast_service {
    use std::sync::Arc;

    use tokio::sync::Mutex;
    use types::socket::ServerMessage;

    use crate::AppState;

    pub async fn broadcast(state: Arc<Mutex<AppState>>, msg: impl Into<ServerMessage>) {
        let state = state.lock().await;
        let msg: ServerMessage = msg.into();

        if let Some(tx) = state.tx.as_ref() {
            let tx = tx.lock().await;

            if let Ok(msg_json) = serde_json::to_string(&msg)
                && let Err(err) = tx.send(msg_json)
            {
                tracing::error!("Failed to broadcast socket message: {err}");
            }
        }
    }
}

pub mod achievements_service {
    use std::sync::Arc;

    use futures_util::TryStreamExt;
    use tokio::sync::Mutex;
    use tracing::info;
    use types::{
        achievement::{Achievement, AchievementDto, AchievementId},
        socket::ServerMessage,
    };

    use sqlx::Row;

    use crate::{AppState, services::broadcast_service};

    pub async fn complete_achievement(
        state: Arc<Mutex<AppState>>,
        id: AchievementId,
    ) -> Result<(), String> {
        info!("Completing achievement {:#?}", id.id());

        {
            let state = state.clone();

            let achievement = get_achievement(state.clone(), &id).await?;

            if achievement.is_earned && id != AchievementId::TESTING_ACHIEVEMENTS {
                return Ok(());
            }

            {
                let state = state.lock().await;
                let conn = state.db.as_ref().unwrap();

                if let Err(err) = sqlx::query(
                    r#"
            UPDATE achievements SET is_earned = true, earned_at = current_timestamp WHERE id = $1
        "#,
                )
                .bind(achievement.id)
                .execute(conn)
                .await
                {
                    return Err(format!("Error completing achievement: {}", err));
                };
            };

            broadcast_service::broadcast(state.clone(), ServerMessage::Achievement(achievement))
                .await;
        };

        Ok(())
    }

    pub async fn get_achievement(
        state: Arc<Mutex<AppState>>,
        id: &AchievementId,
    ) -> Result<AchievementDto, String> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row =
            sqlx::query("SELECT id, title, description, points, is_earned, earned_at  FROM Achievements WHERE id = $1")
                .bind(id.id())
                .fetch_one(conn)
                .await;

        match row {
            Ok(row) => {
                if row.is_empty() {
                    Err("achievement not found".into())
                } else {
                    Ok(AchievementDto {
                        id: id.id(),
                        title: row.try_get("title").unwrap(),
                        description: row.try_get("description").unwrap(),
                        points: row.try_get("points").unwrap(),
                        is_earned: row.try_get("is_earned").unwrap(),
                        earned_at: row.try_get("earned_at").unwrap(),
                    })
                }
            }
            Err(err) => Err(format!("Error getting achievement: {err:#?}")),
        }
    }

    pub async fn get_achievements(state: Arc<Mutex<AppState>>) -> Vec<AchievementDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows = sqlx::query(
            "SELECT id, title, description, points, is_earned, earned_at FROM Achievements",
        )
        .fetch(conn);

        let mut achievements: Vec<Achievement> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            achievements.push(Achievement {
                id: row.try_get("id").unwrap(),
                title: row.try_get("title").unwrap(),
                description: row.try_get("description").unwrap(),
                points: row.try_get("points").unwrap(),
                is_earned: row.try_get("is_earned").unwrap(),
                earned_at: row.try_get("earned_at").unwrap(),
            });
        }

        achievements
            .clone()
            .iter()
            .map(|achievement| achievement.clone().into())
            .collect()
    }
}

pub mod db_service {
    use std::{path::PathBuf, str::FromStr};

    use sqlx::{
        SqlitePool,
        sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    };

    pub async fn verify_database_connection(pool: &SqlitePool) -> Result<(), String> {
        sqlx::query("SELECT count(*) FROM sqlite_master")
            .fetch_one(pool)
            .await
            .map(|_| ())
            .map_err(|err| err.to_string())
    }

    pub async fn is_database_encrypted(db_path: &PathBuf) -> Result<bool, String> {
        let db_uri = db_path.to_str().expect("db path should parse");

        let options = SqliteConnectOptions::from_str(db_uri)
            .expect("...")
            .create_if_missing(false);

        let pool_result = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await;

        match pool_result {
            Ok(pool) => {
                let query_result = verify_database_connection(&pool).await;

                match query_result {
                    Ok(_) => Ok(false),
                    Err(_) => Ok(true),
                }
            }
            Err(_) => Ok(true),
        }
    }
}

pub mod template_service {
    use std::sync::Arc;

    use axum::{
        Json,
        extract::{Path, State},
    };
    use serde::{Deserialize, Serialize};
    use tokio::sync::Mutex;
    use types::conversation::ConversationTemplate;

    use crate::AppState;

    pub async fn get_templates(
        State(state): State<Arc<Mutex<AppState>>>,
    ) -> Json<Vec<ConversationTemplate>> {
        let state = state.clone();
        let state = state.lock().await;

        Json(state.conversation_templates.clone())
    }

    #[derive(Deserialize, Serialize)]
    pub struct CreateTemplateBody {
        title: Option<String>,
    }

    pub async fn create_template(
        State(state): State<Arc<Mutex<AppState>>>,
        Json(body): Json<CreateTemplateBody>,
    ) -> Json<ConversationTemplate> {
        let state = state.clone();
        let mut state = state.lock().await;

        let default_assistant_persona_id = state
            .settings
            .default_assistant_persona_id
            .clone()
            .unwrap_or_default();

        let default_assistant_persona = state
            .personass
            .iter()
            .find(|t| t.id == default_assistant_persona_id);

        let default_user_persona_id = state
            .settings
            .default_user_persona_id
            .clone()
            .unwrap_or_default();

        let default_user_persona = state
            .personass
            .iter()
            .find(|t| t.id == default_user_persona_id);

        let mut created_template = ConversationTemplate::new(body.title);

        if let Some(default_assistant_persona) = default_assistant_persona {
            created_template.assistant_persona = Some(types::conversation::TemplatePersona::Id(
                default_assistant_persona.id.clone(),
            ))
        }

        if let Some(default_user_persona) = default_user_persona {
            created_template.user_persona = Some(types::conversation::TemplatePersona::Id(
                default_user_persona.id.clone(),
            ))
        }

        state.conversation_templates.push(created_template.clone());

        Json(created_template)
    }

    pub async fn get_template(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(template_id): Path<String>,
    ) -> Json<ConversationTemplate> {
        let state = state.clone();
        let state = state.lock().await;

        Json(
            state
                .conversation_templates
                .iter()
                .find(|x| x.id == template_id)
                .cloned()
                .expect(&format!("should have template by id: {template_id}")),
        )
    }

    pub async fn update_template(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(template_id): Path<String>,
        Json(body): Json<ConversationTemplate>,
    ) -> Json<ConversationTemplate> {
        let state = state.clone();
        let mut state = state.lock().await;

        let template = state
            .conversation_templates
            .iter_mut()
            .find(|t| t.id == template_id);

        match template {
            Some(template) => {
                *template = body;

                Json(template.clone())
            }
            None => {
                state.conversation_templates.push(body.clone());
                Json(body)
            }
        }
    }

    pub async fn delete_template(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(template_id): Path<String>,
    ) {
        let state = state.clone();
        let mut state = state.lock().await;

        state.conversation_templates = state
            .conversation_templates
            .iter()
            .filter(|x| x.id != template_id)
            .cloned()
            .collect();
    }
}

pub mod persona_services {
    use std::sync::Arc;

    use axum::{
        Json,
        extract::{Path, State},
    };
    use hyper::StatusCode;
    use tokio::sync::Mutex;
    use types::conversation::{NewPersona, Persona};

    use crate::AppState;

    pub async fn get_personas(State(state): State<Arc<Mutex<AppState>>>) -> Json<Vec<Persona>> {
        let state = state.clone();
        let state = state.lock().await;

        Json(state.personass.clone())
    }

    pub async fn add_personas(
        State(state): State<Arc<Mutex<AppState>>>,
        Json(body): Json<NewPersona>,
    ) -> Json<Persona> {
        let state = state.clone();
        let mut state = state.lock().await;

        let persona = Persona::new(&body.name, body.description.as_deref());

        state.personass.push(persona.clone());

        Json(persona)
    }

    pub async fn get_persona(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(persona_id): Path<String>,
    ) -> Json<Persona> {
        let state = state.clone();
        let mut state = state.lock().await;

        let persona = state
            .personass
            .iter_mut()
            .find(|t| t.id == persona_id)
            .ok_or(StatusCode::NOT_FOUND)
            .unwrap();

        Json(persona.clone())
    }

    pub async fn delete_persona(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(persona_id): Path<String>,
    ) {
        let state = state.clone();
        let mut state = state.lock().await;

        state.personass = state
            .personass
            .iter()
            .filter(|x| x.id != persona_id)
            .cloned()
            .collect();
    }

    pub async fn update_persona(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(persona_id): Path<String>,
        Json(body): Json<Persona>,
    ) -> Json<Persona> {
        let state = state.clone();
        let mut state = state.lock().await;

        let persona = state.personass.iter_mut().find(|t| t.id == persona_id);

        match persona {
            Some(persona) => {
                *persona = body;

                Json(persona.clone())
            }
            None => {
                state.personass.push(body.clone());
                Json(body)
            }
        }
    }
}

pub mod conversation_service {
    use std::sync::Arc;

    use axum::{
        Json,
        extract::{Path, Query, State},
    };
    use serde::{Deserialize, Serialize};
    use tokio::sync::Mutex;
    use types::conversation::{Conversation, TemplatePersona};

    use crate::AppState;

    pub async fn get_conversations(
        State(state): State<Arc<Mutex<AppState>>>,
    ) -> Json<Vec<Conversation>> {
        let state = state.clone();
        let state = state.lock().await;

        Json(state.conservations.clone())
    }

    pub async fn start_conversation(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(template_id): Path<String>,
    ) -> Json<Conversation> {
        let state = state.clone();
        let mut state = state.lock().await;

        let template = state
            .conversation_templates
            .iter()
            .find(|x| x.id == template_id)
            .cloned()
            .expect("should have template by id");

        dbg!("start_conversation", &template);

        let assistant_persona_from_id = template.assistant_persona.as_ref().and_then(
            |template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(persona),
            },
        );

        let user_persona_from_id =
            template
                .user_persona
                .as_ref()
                .and_then(|template_persona| match template_persona {
                    TemplatePersona::Id(id) => {
                        state.personass.iter().find(|persona| persona.id == *id)
                    }
                    TemplatePersona::Embedded(persona) => Some(persona),
                });

        let conversation: Conversation =
            Conversation::from_template(&template, assistant_persona_from_id, user_persona_from_id);

        dbg!("start_conversation", &conversation);

        state.conservations.push(conversation.clone());

        Json(conversation)
    }

    #[derive(Serialize, Deserialize)]
    pub struct PreviewQueryParams {
        at: Option<usize>,
    }

    pub async fn preview_conversation(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(template_id): Path<String>,
        Query(params): Query<PreviewQueryParams>,
    ) -> Json<Conversation> {
        let state = state.clone();
        let state = state.lock().await;

        let mut template = state
            .conversation_templates
            .iter()
            .find(|x| x.id == template_id)
            .cloned()
            .expect("should have template by id");

        let assistant_persona_from_id = template.assistant_persona.as_ref().and_then(
            |template_persona| match template_persona {
                TemplatePersona::Id(id) => state.personass.iter().find(|persona| persona.id == *id),
                TemplatePersona::Embedded(persona) => Some(persona),
            },
        );

        let user_persona_from_id =
            template
                .user_persona
                .as_ref()
                .and_then(|template_persona| match template_persona {
                    TemplatePersona::Id(id) => {
                        state.personass.iter().find(|persona| persona.id == *id)
                    }
                    TemplatePersona::Embedded(persona) => Some(persona),
                });

        if let Some(at) = params.at
            && at > 0
        {
            template.items = template.items[..at].to_vec()
        }

        let conversation: Conversation =
            Conversation::from_template(&template, assistant_persona_from_id, user_persona_from_id);

        Json(conversation)
    }

    pub async fn delete_conversation(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(conversation_id): Path<String>,
    ) {
        let state = state.clone();
        let mut state = state.lock().await;

        state.conservations = state
            .conservations
            .iter()
            .filter(|x| x.id != conversation_id)
            .cloned()
            .collect();
    }

    pub async fn update_conversation(
        State(state): State<Arc<Mutex<AppState>>>,
        Path(conversation_id): Path<String>,
        Json(body): Json<Conversation>,
    ) -> Json<Conversation> {
        let state = state.clone();
        let mut state = state.lock().await;

        let template = state
            .conservations
            .iter_mut()
            .find(|t| t.id == conversation_id);

        match template {
            Some(template) => {
                *template = body;

                Json(template.clone())
            }
            None => {
                state.conservations.push(body.clone());
                Json(body)
            }
        }
    }
}
