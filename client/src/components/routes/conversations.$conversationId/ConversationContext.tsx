import { StatePair } from "@/lib/statePair";
import { createContext } from "react";

type ContextType = {
  editingMessageIndexState: StatePair<number | null>;
  systemMessagesAreVisibleState: StatePair<boolean>;
};

export const ConversationContext = createContext<ContextType | null>(null);
