import { WEBSOCKET_URL } from "@/constants";
import useWebSocket, { Options } from "react-use-websocket";

export const useServerWebSocket = (
  socketUrl: string = WEBSOCKET_URL,
  options?: Options
) => {
  return useWebSocket(socketUrl, {
    ...options,
    share: true,
    retryOnError: true,
    reconnectAttempts: 10,
    reconnectInterval: 5000,
  });
};
