use axum::{
    Router,
    extract::{
        WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
    routing::any,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::from_str;
use tracing::{info, instrument};

use std::sync::Arc;

use axum::extract::State;
use tokio::{spawn, sync::mpsc::unbounded_channel};
use types::socket::ClientMessage;

use crate::AsyncAppState;

pub fn websockets_routes(state: AsyncAppState) -> Router<AsyncAppState> {
    Router::new().route("/", any(ws_handler)).with_state(state)
}

#[axum::debug_handler]
#[instrument(skip(ws, state))]
async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AsyncAppState>) -> impl IntoResponse {
    // finalize the upgrade process by returning upgrade callback.
    // we can customize the callback by sending additional info such as address.
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

#[instrument(skip(socket, state))]
async fn handle_socket(socket: WebSocket, state: AsyncAppState) {
    info!("WebSocket connection established");

    let (tx, mut rx) = unbounded_channel::<String>();

    let (mut sender, mut reciever) = socket.split();

    {
        let mut locked_state = state.lock().await;
        locked_state.tx = Some(Arc::new(tx.into()));
    }

    let send_task = spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Keep reading from the socket to detect disconnects
    while let Some(Ok(msg)) = reciever.next().await {
        match msg {
            Message::Text(utf8_bytes) => {
                match from_str::<ClientMessage>(utf8_bytes.as_str()).unwrap() {
                    ClientMessage::Log { level, message } => {
                        info!("client log: [{level}] {message}");
                    }
                    ClientMessage::Navigation { from, to } => match from {
                        None => info!("client navigation to '{to}'"),
                        Some(from) => info!("client navigation from '{from}' to '{to}'"),
                    },
                }
            }
            Message::Close(_) => {
                info!("Closing connection");
                break;
            }
            _ => {}
        }
    }

    // Remove client and clean up
    {
        info!("Cleaning tx");
        let mut state = state.lock().await;

        state.tx = None;
    }

    send_task.abort();
}
