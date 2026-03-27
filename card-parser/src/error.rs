use thiserror::Error;

#[derive(Debug, Error)]
pub enum CharCardError {
    #[error("PNG decoding error: {0}")]
    PngDecode(#[from] png::DecodingError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("PNG encoding error: {0}")]
    PngEncode(#[from] png::EncodingError),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Base64 decode error: {0}")]
    Base64(#[from] base64::DecodeError),

    #[error("No character card found in PNG")]
    MissingCard,

    #[error("Invalid PNG format")]
    InvalidPng,
}
