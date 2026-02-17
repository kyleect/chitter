import { ReadyState } from "react-use-websocket";

export const WEBSOCKET_URL = import.meta.env.DEV
  ? "ws://localhost:3001/api/ws"
  : (`ws://${window.location.host}/api/ws` as const);

export const WEBSOCKET_STATUSES = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Connected",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
} as const;

export const WEBSOCKET_STATUS_COLORS = {
  [ReadyState.CONNECTING]: "yellow",
  [ReadyState.OPEN]: "green",
  [ReadyState.CLOSING]: "yellow",
  [ReadyState.CLOSED]: "red",
  [ReadyState.UNINSTANTIATED]: "red",
} as const;

export const DATE_FORMAT = "YYYY-MM-DD";
