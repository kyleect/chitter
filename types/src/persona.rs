use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Eq, Debug, PartialEq, Hash, Serialize, Deserialize, Default)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct Persona {
    pub id: String,
    pub name: String,
    pub description: String,
    pub first_messages: Vec<String>,
}

impl Persona {
    pub fn new(name: &str, description: Option<&str>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            description: description.map(ToString::to_string).unwrap_or_default(),
            first_messages: vec![],
        }
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct NewPersona {
    pub name: String,
    pub description: Option<String>,
    pub first_messages: Vec<String>,
}
