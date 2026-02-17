use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::achievement::AchievementDto;

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ServerMessage {
    Achievement(AchievementDto),
}

impl From<AchievementDto> for ServerMessage {
    fn from(value: AchievementDto) -> Self {
        Self::Achievement(value)
    }
}

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ClientMessage {
    Log { level: String, message: String },
    Navigation { from: Option<String>, to: String },
}
