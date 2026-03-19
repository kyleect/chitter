import { Stack } from "@mantine/core";
import { ReactNode, useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import {
  isEndIf,
  isIfEqItem,
  isInnerThoughtsItem,
  isMessageItem,
  isOOCItem,
  isSetVarItem,
} from "@/queries/conversations";
import { DividerBar } from "./DividerBar";
import {
  EndIfTemplateBlock,
  IfEqTemplateBlock,
  InnerThoughtsTemplateBlock,
  MessageTemplateBlock,
  OOCTemplateBlock,
  SetVarTemplateBlock,
} from "./TemplateBlock";
import { modals } from "@mantine/modals";
import { usePatchTemplateItems } from "@/hooks/usePatchTemplateItems";

export const TemplateFormBlocks = () => {
  const context = useContext(TemplateContext)!;

  const { isEditingState, draftTemplateBlocksState: draftTemplateItemsState } =
    context;

  const [_, setIsEditing] = isEditingState;
  const [draftTemplateItems] = draftTemplateItemsState;

  const patchItems = usePatchTemplateItems();

  const handleDeleteAtIndex = (index: number) => () => {
    modals.openConfirmModal({
      title: "Delete Item?",
      labels: {
        confirm: "Delete",
        cancel: "Don't Delete",
      },
      confirmProps: {
        color: "red",
      },
      onConfirm() {
        patchItems((items) => {
          items.splice(index, 1);
        });
      },
    });
  };

  if (draftTemplateItems.length === 0) {
    return <DividerBar index={-1} onClickAdd={() => setIsEditing(true)} />;
  }

  return (
    <Stack gap="xs">
      <DividerBar index={-1} />

      {draftTemplateItems.map((item, index) => {
        let block: ReactNode = null;

        switch (true) {
          case isMessageItem(item):
            block = (
              <MessageTemplateBlock
                index={index}
                item={item}
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
          case isOOCItem(item):
            block = (
              <OOCTemplateBlock
                index={index}
                item={item}
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
          case isInnerThoughtsItem(item):
            block = (
              <InnerThoughtsTemplateBlock
                index={index}
                item={item}
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
          case isSetVarItem(item):
            block = (
              <SetVarTemplateBlock
                index={index}
                item={item}
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
          case isIfEqItem(item):
            block = (
              <IfEqTemplateBlock
                index={index}
                item={item}
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
          case isEndIf(item):
            block = (
              <EndIfTemplateBlock
                handleDeleteAtIndex={handleDeleteAtIndex(index)}
              />
            );
            break;
        }

        return (
          <>
            {block}

            <DividerBar index={index} />
          </>
        );
      })}
    </Stack>
  );
};
