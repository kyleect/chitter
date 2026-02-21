import { ActionIcon, Divider, Menu } from "@mantine/core";
import {
  IconBrain,
  IconCode,
  IconCodeDots,
  IconCompass,
  IconCpu,
  IconMail,
  IconPlus,
  IconRobot,
  IconUser,
  IconVariablePlus,
} from "@tabler/icons-react";
import { ConversationItem } from "server-types";

type Props = {
  index: number;
  isEditing: boolean;
  patchItemsWithInsertAt: (index: number, newItem: ConversationItem) => void;
  setAt: React.Dispatch<React.SetStateAction<number | undefined>>;
  open: () => void;
};

export const DividerBar: React.FC<Props> = ({
  index,
  isEditing,
  patchItemsWithInsertAt,
  setAt,
  open,
}) => (
  <Divider
    mt={0}
    variant="dashed"
    // size="sm"
    label={
      <ActionIcon.Group>
        {isEditing && (
          <Menu shadow="md" width={200} position="right-start">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
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
                    leftSection={<IconRobot />}
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
                    leftSection={<IconUser />}
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
                    leftSection={<IconCpu />}
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
                leftSection={<IconVariablePlus />}
                onClick={() => {
                  patchItemsWithInsertAt(index + 1, {
                    setVar: ["foo", { string: "bar" }],
                  });
                }}
              >
                Set Variable
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCode />}
                onClick={() => {
                  patchItemsWithInsertAt(index + 1, {
                    ifEq: ["foo", { string: "bar" }],
                  });
                }}
              >
                If Equals
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCompass />}
                onClick={() => {
                  patchItemsWithInsertAt(index + 1, {
                    oOC: "",
                  });
                }}
              >
                OOC
              </Menu.Item>
              <Menu.Item
                leftSection={<IconBrain />}
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
            open();
            setAt(index + 1);
          }}
        >
          <IconCodeDots stroke={1.5} />
        </ActionIcon>
      </ActionIcon.Group>
    }
  />
);
