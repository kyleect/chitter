use bon::Builder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
    pub content: String,
}
