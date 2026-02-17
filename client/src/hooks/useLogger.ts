import { useServerWebSocket } from "./useServerWebSocket";
import { ClientMessage } from "server-types";

export const useLogger = () => {
  const { sendJsonMessage } = useServerWebSocket();

  const logger = (level: "info" | "error", message: string) => {
    console.log(`[${level}] ${message}`);

    const clientMessage: ClientMessage = {
      type: "Log",
      data: {
        level,
        message,
      },
    } as const;

    sendJsonMessage(clientMessage);
  };

  return logger;
};
