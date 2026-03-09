import { StatePair } from "@/lib/statePair";
import { createContext } from "react";

type ContextType = {
  editingMessageIndexState: StatePair<number | null>;
};

export const ConversationContext = createContext<ContextType | null>(null);
