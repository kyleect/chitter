use std::fmt::Display;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum VariableValue {
    String(String),
    Boolean(bool),
    Number(f64),
}

impl Display for VariableValue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VariableValue::String(value) => write!(f, "{}", value),
            VariableValue::Boolean(value) => write!(f, "{}", value),
            VariableValue::Number(value) => write!(f, "{}", value),
        }
    }
}

impl From<String> for VariableValue {
    fn from(value: String) -> Self {
        Self::String(value)
    }
}

impl From<bool> for VariableValue {
    fn from(value: bool) -> Self {
        Self::Boolean(value)
    }
}

impl From<f64> for VariableValue {
    fn from(value: f64) -> Self {
        Self::Number(value)
    }
}

#[derive(TS, Clone, Debug, Eq, Hash, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct VariableKey(pub String);
