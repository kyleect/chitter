import { TemplateBlock } from "@/components/routes/templates.$templateId/TemplateBlock";
import {
  isEndIf,
  isIfEqItem,
  isInnerThoughtsItem,
  isMessageItem,
  isOOCItem,
  isSetVarItem,
  patchItemImmer,
  patchItemsImmer,
  patchItemsWithInsertAt,
  useGetTemplateByIdPreviewQuery,
  useGetTemplateByIdQuery,
  useUpdateTemplateByIdMutation,
} from "@/queries/templates";
import {
  Affix,
  Alert,
  Button,
  Card,
  Code,
  Divider,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  Transition,
} from "@mantine/core";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
import {
  IconBrain,
  IconCode,
  IconCodeOff,
  IconCompass,
  IconCpu,
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
import { modals } from "@mantine/modals";
import { DividerBar } from "@/components/routes/templates.$templateId/DividerBar";
import { ConversationPreviewDrawer } from "@/components/routes/templates.$templateId/ConversationPreviewDrawer";
import { Buttons } from "@/components/routes/templates.$templateId/Buttons";

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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
                  />
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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
                  />
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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
                  />
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

                  <DividerBar
                    index={index}
                    isEditing={isEditing}
                    patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
                    setAt={setAt}
                    open={open}
                  />
                </>
              );
            }

            return null;
          })}
        </Stack>
      </Stack>

      <ConversationPreviewDrawer
        opened={opened}
        close={close}
        templateByIdItems={getTemplateByIdQuery.data.items}
        templateByIdPreview={getTemplateByIdPreviewQuery.data}
        at={at}
      />

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
