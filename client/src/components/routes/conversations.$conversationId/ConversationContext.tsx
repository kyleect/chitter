import { createContext } from "react";

type ContextType = {
  isEditingMessage: boolean;
  setIsEditingMessage: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ConversationContext = createContext<ContextType | null>(null);
