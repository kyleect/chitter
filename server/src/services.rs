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
