use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::persona::Persona;

/// Personas can either be embedded in a template or referenced by ID.
#[derive(TS, Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
#[ts(export)]
pub enum TemplatePersona {
    Id(String),
    Embedded(Persona),
}

impl From<&str> for TemplatePersona {
    fn from(value: &str) -> Self {
        Self::Id(value.to_string())
    }
}

impl From<Persona> for TemplatePersona {
    fn from(value: Persona) -> Self {
        Self::Embedded(value.clone())
    }
}
