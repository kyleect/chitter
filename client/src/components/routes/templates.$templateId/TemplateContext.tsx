import { createContext } from "react";
import { ConversationTemplate } from "server-types";

type StatePair<T> = [T, React.Dispatch<React.SetStateAction<T>>];

type ContextType = {
  template: ConversationTemplate;

  isEditingState: StatePair<boolean>;
  draftTitleState: StatePair<string>;
  draftInsertablesState: StatePair<[string, string][]>;

  draftAssistantPersonaIdState: StatePair<string | null>;
  draftUserPersonaIdState: StatePair<string | null>;

  draftTemplateItemsState: StatePair<ConversationTemplate["items"]>;

  previewConversationAtIndexState: StatePair<number | undefined>;
  previewConversationModal: {
    open: () => void;
    close: () => void;
    opened: boolean;
  };
};

export const TemplateContext = createContext<ContextType | null>(null);
