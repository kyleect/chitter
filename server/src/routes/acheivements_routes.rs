use axum::{Router, routing::get};
use futures_util::TryStreamExt;
use hyper::StatusCode;
use sqlx::Row;

use axum::{Json, extract::State};
use types::achievement::{Achievement, AchievementDto};

use crate::app_state::AsyncAppState;

pub fn achievements_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new()
        .route("/", get(get_achievements))
        .with_state(state)
}

async fn get_achievements_inner(state: AsyncAppState) -> Vec<AchievementDto> {
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

async fn get_achievements(
    State(state): State<AsyncAppState>,
) -> (StatusCode, Json<Vec<AchievementDto>>) {
    (StatusCode::OK, Json(get_achievements_inner(state).await))
}
