import { StatePair } from "@/lib/statePair";
import { createContext } from "react";
import {
  ConversationTemplate,
  TemplatePersona,
  TemplateVariant,
} from "server-types";

type ContextType = {
  template: ConversationTemplate;

  variantState: StatePair<string | null>;

  isEditingState: StatePair<boolean>;
  draftTitleState: StatePair<string>;
  draftInsertablesState: StatePair<[string, string][]>;

  draftAssistantPersonaState: StatePair<TemplatePersona | null>;
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
