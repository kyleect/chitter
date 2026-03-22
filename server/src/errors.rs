use axum::response::{IntoResponse, Response};
use hyper::StatusCode;
use tracing::error;

#[derive(Debug)]
pub enum ServerError {
    Io(String),
    DbEncryptionKeyRequiredButNotProvided,
}

impl std::fmt::Display for ServerError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ServerError::Io(printable) => write!(f, "{}", printable),
            ServerError::DbEncryptionKeyRequiredButNotProvided => {
                write!(f, "Db encryption key required but not provided")
            }
        }
    }
}

impl From<std::io::Error> for ServerError {
    fn from(err: std::io::Error) -> Self {
        ServerError::Io(err.to_string())
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let body = self.to_string();

        error!(body);
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}
