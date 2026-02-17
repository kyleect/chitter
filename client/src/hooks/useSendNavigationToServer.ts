import { useServerWebSocket } from "./useServerWebSocket";
import { ClientMessage } from "server-types";

export const useSendNavigationToServer = () => {
  const { sendJsonMessage } = useServerWebSocket();

  const sendNavigation = (to: string, from?: string) => {
    const clientMessage: ClientMessage = {
      type: "Navigation",
      data: {
        from: from ?? null,
        to,
      },
    } as const;

    sendJsonMessage(clientMessage);
  };

  return sendNavigation;
};
