import { StatePair } from "@/lib/statePair";
import { createContext } from "react";
import {
  ConversationTemplate,
  Persona,
  TemplatePersona,
  TemplatePrompt,
  TemplateVariant,
} from "server-types";

type ContextType = {
  template: ConversationTemplate;

  selectedFirstMessageIndexState: StatePair<number>;

  variantState: StatePair<string | null>;

  isEditingState: StatePair<boolean>;
  draftTitleState: StatePair<string>;
  draftInsertablesState: StatePair<[string, string][]>;
  showChatLinksState: StatePair<boolean>;
  draftPromptsState: StatePair<TemplatePrompt[]>;

  draftAssistantPersonaState: StatePair<TemplatePersona | null>;
  assistantPersonaResolved: Persona | null;
  draftUserPersonaState: StatePair<TemplatePersona | null>;

  draftTemplateBlocksState: StatePair<ConversationTemplate["blocks"]>;
  draftVariantBlocksState: StatePair<TemplateVariant["blocks"]>;

  previewConversationAtIndexState: StatePair<number | undefined>;
  previewConversationModal: {
    open: () => void;
    close: () => void;
    opened: boolean;
  };
};

export const TemplateContext = createContext<ContextType | null>(null);
