import { AssistantIcon } from "@/components/common/AssistantIcon";
import { IfEqIcon } from "@/components/common/IfEqIcon";
import { InnerThoughtsIcon } from "@/components/common/InnerThoughtsIcon";
import { OOCIcon } from "@/components/common/OOCIcon";
import { SetVarIcon } from "@/components/common/SetVarIcon";
import { SystemIcon } from "@/components/common/SystemIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { ActionIcon, Divider, Menu } from "@mantine/core";
import { IconCodeDots, IconMail, IconPlus } from "@tabler/icons-react";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { usePatchItemsWithInsertAt } from "@/hooks/usePatchTemplateItems";

type Props = {
  index: number;

  onClickAdd?: () => void;
};

export const DividerBar: React.FC<Props> = ({ index, onClickAdd }) => {
  const context = useContext(TemplateContext)!;
  const patchItemsWithInsertAt = usePatchItemsWithInsertAt();

  const { previewConversationAtIndexState, isEditingState } = context;
  const [isEditing] = isEditingState;

  const [_, setAt] = previewConversationAtIndexState;

  return (
    <Divider
      mt={0}
      variant="dashed"
      // size="sm"
      label={
        <ActionIcon.Group>
          {isEditing && (
            <Menu shadow="md" width={200} position="right-start">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    onClickAdd?.();
                  }}
                >
                  <IconPlus />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>New Template Block</Menu.Label>

                <Menu.Sub>
                  <Menu.Sub.Target>
                    <Menu.Sub.Item leftSection={<IconMail />}>
                      Message
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>

                  <Menu.Sub.Dropdown>
                    <Menu.Item
                      leftSection={<AssistantIcon />}
                      onClick={() => {
                        patchItemsWithInsertAt(index + 1, {
                          message: {
                            role: {
                              kind: "assistant",
                            },
                            message: null,
                            kind: "Message",
                          },
                        });
                      }}
                    >
                      Assistant
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<UserIcon />}
                      onClick={() => {
                        patchItemsWithInsertAt(index + 1, {
                          message: {
                            role: {
                              kind: "user",
                            },
                            message: null,
                            kind: "Message",
                          },
                        });
                      }}
                    >
                      User
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<SystemIcon />}
                      onClick={() => {
                        patchItemsWithInsertAt(index + 1, {
                          message: {
                            role: {
                              kind: "system",
                            },
                            message: null,
                            kind: "Message",
                          },
                        });
                      }}
                    >
                      System
                    </Menu.Item>
                  </Menu.Sub.Dropdown>
                </Menu.Sub>

                <Menu.Item
                  leftSection={<SetVarIcon />}
                  onClick={() => {
                    patchItemsWithInsertAt(index + 1, {
                      setVar: ["foo", { string: "bar" }],
                    });
                  }}
                >
                  Set Variable
                </Menu.Item>
                <Menu.Item
                  leftSection={<IfEqIcon />}
                  onClick={() => {
                    patchItemsWithInsertAt(index + 1, {
                      ifEq: ["foo", { string: "bar" }],
                    });
                  }}
                >
                  If Equals
                </Menu.Item>
                <Menu.Item
                  leftSection={<OOCIcon />}
                  onClick={() => {
                    patchItemsWithInsertAt(index + 1, {
                      oOC: "",
                    });
                  }}
                >
                  OOC
                </Menu.Item>
                <Menu.Item
                  leftSection={<InnerThoughtsIcon />}
                  onClick={() => {
                    patchItemsWithInsertAt(index + 1, {
                      innerThoughts: "",
                    });
                  }}
                >
                  Inner Thoughts
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              context.previewConversationModal.open();
              setAt(index + 1);
            }}
          >
            <IconCodeDots stroke={1.5} />
          </ActionIcon>
        </ActionIcon.Group>
      }
    />
  );
};
