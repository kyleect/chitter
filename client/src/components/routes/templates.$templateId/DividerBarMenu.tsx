import { AssistantIcon } from "@/components/common/AssistantIcon";
import { IfEqIcon } from "@/components/common/IfEqIcon";
import { InnerThoughtsIcon } from "@/components/common/InnerThoughtsIcon";
import { OOCIcon } from "@/components/common/OOCIcon";
import { SetVarIcon } from "@/components/common/SetVarIcon";
import { SystemIcon } from "@/components/common/SystemIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { usePatchItemsWithInsertAt } from "@/hooks/usePatchTemplateItems";
import { useGetInsertablesQuery } from "@/queries/insertables";
import { Alert, Button, Loader, Menu } from "@mantine/core";
import { IconMail } from "@tabler/icons-react";
import { FC, ReactNode } from "react";

type Props = {
  onClickAdd?: () => void;
  index: number;
  children: ReactNode;
};

export const DividerBarMenu: FC<Props> = ({ children, index }) => {
  const patchItemsWithInsertAt = usePatchItemsWithInsertAt();
  const getInsertablesQuery = useGetInsertablesQuery();

  if (getInsertablesQuery.isPending) {
    return <Loader />;
  }

  if (getInsertablesQuery.isError) {
    return <Alert color="red">Error fetching insertables</Alert>;
  }

  return (
    <Menu shadow="md" width={200} position="right-start">
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>New Template Block</Menu.Label>

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<IconMail />}>Message</Menu.Sub.Item>
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

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>Insertables</Menu.Sub.Item>
              </Menu.Sub.Target>

              <Menu.Sub.Dropdown>
                {getInsertablesQuery.data.map(
                  ([insertableName, insertableContent]) => (
                    <Menu.Item>
                      <Button
                        size="compact-sm"
                        color="violet"
                        variant="transparent"
                        onClick={() => {
                          patchItemsWithInsertAt(index + 1, {
                            message: {
                              role: {
                                kind: "system",
                              },
                              message: insertableContent,
                              kind: "Message",
                            },
                          });
                        }}
                      >
                        {insertableName}
                      </Button>
                    </Menu.Item>
                  ),
                )}
              </Menu.Sub.Dropdown>
            </Menu.Sub>
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
  );
};
