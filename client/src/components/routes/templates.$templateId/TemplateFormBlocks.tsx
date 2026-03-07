import { Code, Select, Stack, Text, Textarea } from "@mantine/core";
import { useContext } from "react";
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
import { UserIcon } from "@/components/common/UserIcon";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { SystemIcon } from "@/components/common/SystemIcon";
import { TemplateBlock } from "./TemplateBlock";
import { OOCIcon } from "@/components/common/OOCIcon";
import { InnerThoughtsIcon } from "@/components/common/InnerThoughtsIcon";
import { EndIfIcon, IfEqIcon } from "@/components/common/IfEqIcon";
import { modals } from "@mantine/modals";
import {
  patchItemImmer,
  patchItemsImmer,
  patchItemsWithInsertAt,
} from "@/queries/templates";
import { ConversationItem, Message, VariableValue } from "server-types";
import { SetVarIcon } from "@/components/common/SetVarIcon";

export const TemplateFormBlocks = () => {
  const context = useContext(TemplateContext)!;

  const {
    isEditingState,
    previewConversationModal,
    draftTemplateItemsState,
    previewConversationAtIndexState,
  } = context;

  const [isEditing, setIsEditing] = isEditingState;
  const [draftTemplateItems, setDraftTemplateItems] = draftTemplateItemsState;
  const [_, setPreviewConversationAtIndex] = previewConversationAtIndexState;

  const patchItems = patchItemsImmer(setDraftTemplateItems);
  const patchItem = patchItemImmer(setDraftTemplateItems);

  const patchMessageItem = (index: number, value: string) => {
    patchItem(
      index,
      (draftItem, patch) => {
        if (
          isMessageItem(draftItem as unknown as ConversationItem) &&
          isMessageItem(patch as any)
        ) {
          (
            draftItem as {
              message: Message;
            }
            // prettier-ignore
          ).message.message =
            // @ts-expect-error TODO
            patch.message.message;
        }
      },
      {
        message: {
          message: value,
        },
      },
    );
  };

  const patchOOCMessage = (index: number, value: string) => {
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

  const patchInnerThoughtsMessage = (index: number, value: string) => {
    patchItem(index, Object.assign, {
      innerThoughts: value,
    });
  };

  const patchIfEqMessage = (index: number, value: string) => {
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

  const patchSetVarMessage = (index: number, value: string) => {
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

  return (
    <Stack gap="xs">
      <DividerBar
        index={-1}
        isEditing={isEditing}
        patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
        setAt={setPreviewConversationAtIndex}
        open={previewConversationModal.open}
      />

      {draftTemplateItems.length > 0 ? (
        draftTemplateItems.map((item, index) => {
          if (isMessageItem(item)) {
            let icon: React.ReactNode = null;

            switch (item.message.role.kind) {
              case "user":
                icon = <UserIcon />;
                break;
              case "assistant":
                icon = <AssistantIcon />;
                break;
              case "system":
                icon = <SystemIcon />;
                break;
            }

            return (
              <Stack key={index}>
                <TemplateBlock
                  icon={icon}
                  title={
                    isEditing ? (
                      <Select
                        size="md"
                        value={item.message.role.kind}
                        onChange={(newRole) => {
                          if (newRole === null) return;

                          if (
                            newRole !== "user" &&
                            newRole !== "system" &&
                            newRole !== "assistant"
                          ) {
                            return;
                          }

                          patchItem(
                            index,
                            (draft, patch) => {
                              if (
                                isMessageItem(draft as any) &&
                                isMessageItem(patch as any)
                              ) {
                                // prettier-ignore
                                // @ts-expect-error TODO
                                draft.message.role.kind =
                                // prettier-ignore
                                // @ts-expect-error TODO
                                  patch.message.role.kind;
                              }
                            },
                            {
                              message: {
                                role: {
                                  kind: newRole,
                                },
                              },
                            },
                          );
                        }}
                        data={["user", "system", "assistant"] as const}
                      />
                    ) : (
                      <Text
                        fw="bold"
                        style={{
                          textTransform: "capitalize",
                        }}
                      >
                        {item.message.role.kind}
                      </Text>
                    )
                  }
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                >
                  {isEditing ? (
                    <Textarea
                      size="md"
                      minRows={1}
                      autosize
                      value={item.message.message ?? ""}
                      onChange={(e) => patchMessageItem(index, e.target.value)}
                    />
                  ) : (
                    <Text>{item.message.message}</Text>
                  )}
                </TemplateBlock>

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </Stack>
            );
          }

          if (isOOCItem(item)) {
            return (
              <>
                <TemplateBlock
                  icon={<OOCIcon />}
                  title="OOC"
                  level={1}
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                >
                  {isEditing ? (
                    <Textarea
                      size="md"
                      minRows={1}
                      autosize
                      value={item.oOC}
                      onChange={(e) => patchOOCMessage(index, e.target.value)}
                    />
                  ) : (
                    <Text>{item.oOC}</Text>
                  )}
                </TemplateBlock>

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </>
            );
          }

          if (isInnerThoughtsItem(item)) {
            return (
              <>
                <TemplateBlock
                  icon={<InnerThoughtsIcon />}
                  title="Inner Thoughts"
                  level={1}
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                >
                  {isEditing ? (
                    <Textarea
                      size="md"
                      minRows={1}
                      autosize
                      value={item.innerThoughts}
                      onChange={(e) =>
                        patchInnerThoughtsMessage(index, e.target.value)
                      }
                    />
                  ) : (
                    <Text>{item.innerThoughts}</Text>
                  )}
                </TemplateBlock>

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </>
            );
          }

          if (isSetVarItem(item)) {
            const key = item.setVar[0];
            // @ts-ignore
            const value =
              // @ts-ignore
              item.setVar[1]?.string ??
              // @ts-ignore
              item.setVar[1]?.number ??
              // @ts-ignore
              item.setVar[1]?.boolean;

            return (
              <>
                <TemplateBlock
                  icon={<SetVarIcon />}
                  title="Set Variable"
                  inline
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                >
                  {isEditing ? (
                    <Textarea
                      size="md"
                      minRows={1}
                      autosize
                      value={`${key} = ${value}`}
                      onChange={(e) =>
                        patchSetVarMessage(index, e.target.value)
                      }
                    />
                  ) : (
                    <Code block mt={0} mb={0}>
                      {key} = {JSON.stringify(value)}
                    </Code>
                  )}
                </TemplateBlock>

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </>
            );
          }

          if (isIfEqItem(item)) {
            const key = item.ifEq[0];
            // @ts-ignore
            const value =
              // @ts-ignore
              item.ifEq[1]?.string ??
              // @ts-ignore
              item.ifEq[1]?.number ??
              // @ts-ignore
              item.ifEq[1]?.boolean;

            return (
              <>
                <TemplateBlock
                  icon={<IfEqIcon />}
                  title="If Eq"
                  inline
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                >
                  {isEditing ? (
                    <Textarea
                      size="md"
                      minRows={1}
                      autosize
                      value={`${key} = ${value}`}
                      onChange={(e) => patchIfEqMessage(index, e.target.value)}
                    />
                  ) : (
                    <Code block mt={0} mb={0}>
                      {key} = {JSON.stringify(value)}
                    </Code>
                  )}
                </TemplateBlock>

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </>
            );
          }

          if (isEndIf(item)) {
            return (
              <>
                <TemplateBlock
                  icon={<EndIfIcon />}
                  title="End If"
                  isEditing={isEditing}
                  onClose={handleDeleteAtIndex(index)}
                />

                <DividerBar
                  index={index}
                  isEditing={isEditing}
                  patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                  setAt={setPreviewConversationAtIndex}
                  open={previewConversationModal.open}
                />
              </>
            );
          }

          return null;
        })
      ) : (
        <DividerBar
          index={-1}
          isEditing={true}
          patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
          setAt={setPreviewConversationAtIndex}
          open={previewConversationModal.open}
          onClickAdd={() => setIsEditing(true)}
        />
      )}
    </Stack>
  );
};
