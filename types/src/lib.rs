use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub mod achievement;
pub mod completion;
pub mod conversation;
pub mod errors;
pub mod message;
pub mod persona;
pub mod settings;
pub mod socket;
pub mod template;
pub mod utils;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct DebugInfo {
    pub db: String,
    pub db_is_encrypted: bool,
    pub cwd: String,
    pub commit: String,
}
