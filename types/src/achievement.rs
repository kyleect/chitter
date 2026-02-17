use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Achievement {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub points: i32,
    pub is_earned: bool,
    pub earned_at: Option<DateTime<Utc>>,
}

#[derive(Debug, PartialEq)]
pub struct AchievementId(i64);

impl AchievementId {
    pub const TESTING_ACHIEVEMENTS: AchievementId = AchievementId(1);
    pub const WHATS_IN_HERE: AchievementId = AchievementId(3);

    pub fn id(&self) -> i64 {
        self.0
    }
}

impl From<Achievement> for AchievementDto {
    fn from(value: Achievement) -> Self {
        Self {
            id: value.id,
            title: value.title,
            description: value.description,
            points: value.points,
            is_earned: value.is_earned,
            earned_at: value.earned_at.map(|x| x.to_rfc3339()),
        }
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct AchievementDto {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub points: i32,
    pub is_earned: bool,
    pub earned_at: Option<String>,
}
