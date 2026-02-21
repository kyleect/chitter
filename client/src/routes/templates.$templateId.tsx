import { TemplateBlock } from "@/components/routes/templates.$templateId/TemplateBlock";
import {
  isEndIf,
  isIfEqItem,
  isInnerThoughtsItem,
  isMessageItem,
  isOOCItem,
  isSetVarItem,
  useGetTemplateByIdPreviewQuery,
  useGetTemplateByIdQuery,
  useUpdateTemplateByIdMutation,
} from "@/queries/templates";
import {
  ActionIcon,
  Affix,
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Transition,
} from "@mantine/core";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
import {
  IconBrain,
  IconCode,
  IconCodeDots,
  IconCodeOff,
  IconCompass,
  IconCpu,
  IconMail,
  IconPlus,
  IconRobot,
  IconUser,
  IconVariablePlus,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ConversationItem,
  ConversationTemplate,
  Message,
  VariableValue,
} from "server-types";
import { produce } from "immer";
import { modals } from "@mantine/modals";

type Search = {
  at?: number;
};

export const Route = createFileRoute("/templates/$templateId")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): Search => {
    return { ...search };
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const [at, setAt] = useState<number | undefined>();
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [opened, { open, close }] = useDisclosure(false);
  const [scroll] = useWindowScroll();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTemplateItems, setDraftTemplateItems] = useState<
    ConversationTemplate["items"]
  >([]);
  const getTemplateByIdPreviewQuery = useGetTemplateByIdPreviewQuery(
    params.templateId,
    at,
  );

  const updateItemMutation = useUpdateTemplateByIdMutation();

  useEffect(() => {
    setDraftTemplateItems(getTemplateByIdQuery.data?.items ?? []);
  }, [getTemplateByIdQuery.data]);

  if (getTemplateByIdQuery.isLoading && getTemplateByIdPreviewQuery.isLoading) {
    return <Loader />;
  }

  if (getTemplateByIdQuery.isError) {
    return (
      <Alert color="red">
        Failed to load template: {JSON.stringify(getTemplateByIdQuery.error)}
      </Alert>
    );
  }

  if (getTemplateByIdPreviewQuery.isError) {
    return (
      <Alert color="red">
        Failed to load template preview:{" "}
        {JSON.stringify(getTemplateByIdPreviewQuery.error)}
      </Alert>
    );
  }

  const template = getTemplateByIdQuery.data;

  if (!template || !draftTemplateItems) {
    return <Alert color="blue">Template not found</Alert>;
  }

  const patchItems = patchItemsImmer(setDraftTemplateItems);
  const patchItem = patchItemImmer(setDraftTemplateItems);

  const patchItemsWithInsertAt = (index: number, newItem: ConversationItem) =>
    patchItems((items) => items.splice(index, 0, newItem));

  const patchMessageItem = (index: number, value: string) => {
    patchItem(
      index,
      (draftItem, patch) => {
        if (isMessageItem(draftItem as unknown as ConversationItem)) {
          (
                                  draftItem as {
                                    message: Message;
                                  }
                                // prettier-ignore
                              ).message.message =
            // @ts-expect-error: TODO: Fix
            patch.message!.message;
        }
      },
      {
        // @ts-expect-error: patchItem doesn't recursively apply Partial<T> yet
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

  const DividerBar = ({ index }: { index: number }) => (
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

  const handleSave = () => {
    getTemplateByIdQuery.data.items = draftTemplateItems;

    let result = Object.assign({}, getTemplateByIdQuery.data, {
      items: draftTemplateItems,
    });

    updateItemMutation.mutate(result);
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setDraftTemplateItems(getTemplateByIdQuery.data.items);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {};

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Button variant="gradient">Chat</Button>
          <Buttons
            isEditing={isEditing}
            handleCancel={handleCancel}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleDelete={handleDelete}
          />
        </Group>

        <Divider label={"Blocks"} labelPosition="left" mt="md" mb="md" />

        <Stack gap="xs">
          {draftTemplateItems.map((item, index) => {
            if (isMessageItem(item)) {
              let icon: React.ReactNode = null;

              switch (item.message.role.kind) {
                case "user":
                  icon = <IconUser stroke={1.5} />;
                  break;
                case "assistant":
                  icon = <IconRobot stroke={1.5} />;
                  break;
                case "system":
                  icon = <IconCpu stroke={1.5} />;
                  break;
              }

              return (
                <>
                  <TemplateBlock
                    icon={icon}
                    title={
                      isEditing ? (
                        <Select
                          size="md"
                          value={item.message.role.kind}
                          onChange={(newRole) => {
                            if (newRole === null) return;

                            patchItem(
                              index,
                              (draft, patch) => {
                                if (
                                  // @ts-expect-error: WIP
                                  isMessageItem(draft) &&
                                  // @ts-expect-error: WIP
                                  isMessageItem(patch)
                                ) {
                                  draft.message.role.kind =
                                    patch.message.role.kind;
                                }
                              },
                              {
                                message: {
                                  role: {
                                    // @ts-expect-error: WIP
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
                        onChange={(e) =>
                          patchMessageItem(index, e.target.value)
                        }
                      />
                    ) : (
                      <Text>{item.message.message}</Text>
                    )}
                  </TemplateBlock>

                  <DividerBar index={index} />
                </>
              );
            }

            if (isOOCItem(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconCompass stroke={1.5} />}
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

                  <DividerBar index={index} />
                </>
              );
            }

            if (isInnerThoughtsItem(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconBrain stroke={1.5} />}
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

                  <DividerBar index={index} />
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
                    icon={<IconVariablePlus stroke={1.5} />}
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

                  <DividerBar index={index} />
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
                    icon={<IconCode stroke={1.5} />}
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
                        onChange={(e) =>
                          patchIfEqMessage(index, e.target.value)
                        }
                      />
                    ) : (
                      <Code block mt={0} mb={0}>
                        {key} = {JSON.stringify(value)}
                      </Code>
                    )}
                  </TemplateBlock>

                  <DividerBar index={index} />
                </>
              );
            }

            if (isEndIf(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconCodeOff stroke={1.5} />}
                    title="End If"
                    isEditing={isEditing}
                    onClose={handleDeleteAtIndex(index)}
                  />

                  <DividerBar index={index} />
                </>
              );
            }

            return null;
          })}
        </Stack>
      </Stack>

      <Drawer
        zIndex={10000}
        keepMounted={false}
        position="bottom"
        opened={opened}
        onClose={close}
        title={
          <Group>
            <ThemeIcon variant="transparent" color="gray">
              <IconCodeDots />
            </ThemeIcon>
            <Group>
              <Badge radius="xs" variant="outline" color="gray">
                Index: {at}
              </Badge>
              <Text>Conversation State</Text>
            </Group>
          </Group>
        }
        size="lg"
      >
        <Stack mt="md">
          {getTemplateByIdPreviewQuery.data &&
            getTemplateByIdPreviewQuery.data.messages.map((message) => {
              let icon: React.ReactNode = null;

              switch (message.role.kind) {
                case "user":
                  icon = <IconUser stroke={1.5} />;
                  break;
                case "assistant":
                  icon = <IconRobot stroke={1.5} />;
                  break;
                case "system":
                  icon = <IconCpu stroke={1.5} />;
                  break;
              }

              return (
                <TemplateBlock
                  icon={icon}
                  title={
                    <Text
                      fw="bold"
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {message.role.kind}
                    </Text>
                  }
                  isEditing={false}
                >
                  <Text>{message.message}</Text>
                </TemplateBlock>
              );
            })}
        </Stack>
      </Drawer>

      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 100}>
          {(transitionStyles) => (
            <Card p="xs" style={transitionStyles}>
              <Buttons
                isEditing={isEditing}
                handleCancel={handleCancel}
                handleEdit={handleEdit}
                handleSave={handleSave}
                handleDelete={handleDelete}
              />
            </Card>
          )}
        </Transition>
      </Affix>
    </>
  );
}

type Unarray<T> = T extends Array<infer U> ? U : T;

const patchItemsImmer =
  (set: React.Dispatch<React.SetStateAction<ConversationTemplate["items"]>>) =>
  (patchFn: (items: ConversationTemplate["items"]) => void) => {
    set(
      produce((draftItems) => {
        patchFn(draftItems);
      }),
    );
  };

const patchItemImmer =
  (set: React.Dispatch<React.SetStateAction<ConversationTemplate["items"]>>) =>
  (
    draftItemIndex: number,
    patchFn: (
      item: Partial<Unarray<ConversationTemplate["items"]>>,
      patch: Partial<Unarray<ConversationTemplate["items"]>>,
    ) => void,
    patch: Partial<Unarray<ConversationTemplate["items"]>>,
  ) => {
    set(
      produce((draftItems) => {
        const draftItem = draftItems[draftItemIndex];

        debugger;

        patchFn(draftItem, patch);

        console.log(draftItem);

        debugger;
      }),
    );
  };

const Buttons = ({
  isEditing,
  handleCancel,
  handleDelete,
  handleEdit,
  handleSave,
}: {
  isEditing: boolean;
  handleCancel: () => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleDelete: () => void;
}) => (
  <Button.Group>
    {isEditing && (
      <>
        <Button onClick={handleSave}>Save</Button>
        <Button variant="light" onClick={handleCancel}>
          Cancel
        </Button>
      </>
    )}

    {!isEditing && (
      <>
        <Button onClick={handleEdit}>Edit</Button>
      </>
    )}

    <Button variant="outline" onClick={handleDelete}>
      Delete
    </Button>
  </Button.Group>
);
