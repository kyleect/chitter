import { TemplateContext } from "@/components/routes/templates.$templateId/TemplateContext";
import {
  isMessageItem,
  patchItemImmer,
  patchItemsImmer,
  patchItemsWithInsertAt,
} from "@/queries/templates";
import { useContext } from "react";
import { Message, VariableValue } from "server-types";

export const usePatchTemplateItems = () => {
  const context = useContext(TemplateContext)!;

  const { draftTemplateBlocksState: draftTemplateItemsState } = context;

  const [_, setDraftTemplateItems] = draftTemplateItemsState;

  return patchItemsImmer(setDraftTemplateItems);
};

export const usePatchTemplateItem = () => {
  const context = useContext(TemplateContext)!;

  const { draftTemplateBlocksState: draftTemplateItemsState } = context;

  const [_, setDraftTemplateItems] = draftTemplateItemsState;

  return patchItemImmer(setDraftTemplateItems);
};

export const usePatchMessageItem = () => {
  const patchItem = usePatchTemplateItem();

  return (index: number, value: string) =>
    patchItem(
      index,
      (draftItem, patch) => {
        if (isMessageItem(draftItem) && isMessageItem(patch)) {
          (
            draftItem as {
              message: Message;
            }
          ).message.content = patch.message.content;
        }
      },
      {
        message: {
          content: value,
        },
      },
    );
};

export const usePatchOOCMessage = () => {
  const patchItem = usePatchTemplateItem();

  return (index: number, value: string) =>
    patchItem(
      index,
      (draft, patch) => {
        Object.assign(draft, patch);
      },
      {
        oOC: value,
      },
    );
};

export const usePatchInnerThoughtsMessage = () => {
  const patchItem = usePatchTemplateItem();

  return (index: number, value: string) =>
    patchItem(index, Object.assign, {
      innerThoughts: value,
    });
};

export const usePatchIfEqMessage = () => {
  const patchItem = usePatchTemplateItem();

  return (index: number, value: string) => {
    let [draftKey, draftValue] = value.split("=").map((x) => x.trim());
    let draftVarValue: VariableValue | null = null;

    const maybeNumberValue = parseInt(draftValue, 10);
    const maybeBoolValue = draftValue === "true" || draftValue === "false";

    if (!Number.isNaN(maybeNumberValue)) {
      draftVarValue = {
        number: maybeNumberValue,
      };

      patchItem(index, Object.assign, {
        ifEq: [draftKey, draftVarValue],
      });
    } else if (maybeBoolValue) {
      draftVarValue = {
        boolean: draftValue === "true",
      };

      patchItem(index, Object.assign, {
        ifEq: [draftKey, draftVarValue],
      });
    } else {
      draftVarValue = {
        string: draftValue,
      };

      patchItem(index, Object.assign, {
        ifEq: [draftKey, draftVarValue],
      });
    }
  };
};

export const usePatchSetVarMessage = () => {
  const patchItem = usePatchTemplateItem();

  return (index: number, value: string) => {
    let [draftKey, draftValue] = value.split("=").map((x) => x.trim());
    let draftVarValue: VariableValue | null = null;

    const maybeNumberValue = parseInt(draftValue, 10);
    const maybeBoolValue = draftValue === "true" || draftValue === "false";

    if (!Number.isNaN(maybeNumberValue)) {
      draftVarValue = {
        number: maybeNumberValue,
      };

      patchItem(index, Object.assign, {
        setVar: [draftKey, draftVarValue],
      });
    } else if (maybeBoolValue) {
      draftVarValue = {
        boolean: draftValue === "true",
      };

      patchItem(index, Object.assign, {
        setVar: [draftKey, draftVarValue],
      });
    } else {
      draftVarValue = {
        string: draftValue,
      };

      patchItem(index, Object.assign, {
        setVar: [draftKey, draftVarValue],
      });
    }
  };
};

export const usePatchItemsWithInsertAt = () => {
  const patchItems = usePatchTemplateItems();

  return patchItemsWithInsertAt(patchItems);
};
