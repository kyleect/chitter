import { StatePair } from "@/lib/statePair";
import { createContext } from "react";
import { Conversation } from "server-types";

type ContextType = {
  conversation: Conversation;
  editingMessageIndexState: StatePair<number | null>;
  systemMessagesAreVisibleState: StatePair<boolean>;
};

export const ConversationContext = createContext<ContextType | null>(null);
