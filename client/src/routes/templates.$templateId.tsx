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
  TextInput,
  ThemeIcon,
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
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useGetPersonasQuery } from "@/queries/personas";
import { useStartConversationMutation } from "@/queries/conversations";
import { useGetSettingsQuery } from "@/queries/settings";

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
  const nav = Route.useNavigate();
  const [at, setAt] = useState<number | undefined>();
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [opened, { open, close }] = useDisclosure(false);
  const [scroll] = useWindowScroll();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTemplateItems, setDraftTemplateItems] = useState<
    ConversationTemplate["items"]
  >([]);
  const getTemplateByIdPreviewQuery = useGetTemplateByIdPreviewQuery(
    params.templateId,
    at,
  );
  const startConversationMutation = useStartConversationMutation();
  const getSettingsQuery = useGetSettingsQuery();
  const [draftUserPersonaId, setDraftUserPersonaId] = useState<string | null>(
    getSettingsQuery.data?.default_user_persona_id ?? null,
  );
  const [draftAssistantPersonaId, setDraftAssistantPersonaId] = useState<
    string | null
  >(getSettingsQuery.data?.default_assistant_persona_id ?? null);

  const getPersonasQuery = useGetPersonasQuery();

  const updateTemplateMutation = useUpdateTemplateByIdMutation();

  useEffect(() => {
    setDraftTemplateItems(getTemplateByIdQuery.data?.items ?? []);
  }, [getTemplateByIdQuery.data]);

  useEffect(() => {
    if (getTemplateByIdQuery.data) {
      setDraftAssistantPersonaId(getTemplateByIdQuery.data.assistantPersonaId);
      setDraftUserPersonaId(getTemplateByIdQuery.data.userPersonaId);
      setDraftTitle(getTemplateByIdQuery.data.title ?? "");
    }
  }, [getTemplateByIdQuery.data]);

  if (
    getTemplateByIdQuery.isPending &&
    getTemplateByIdPreviewQuery.isPending &&
    getPersonasQuery.isPending &&
    getSettingsQuery.isPending
  ) {
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

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(getPersonasQuery.error)}
      </Alert>
    );
  }

  if (getSettingsQuery.isError) {
    return (
      <Alert color="red">
        Failed to load settings: {JSON.stringify(getSettingsQuery.error)}
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
        if (
          isMessageItem(draftItem as unknown as ConversationItem) &&
          isMessageItem(patch)
        ) {
          (
            draftItem as {
              message: Message;
            }
          ).message.message = patch.message.message;
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

  const handleSave = () => {
    getTemplateByIdQuery.data!.items = draftTemplateItems;

    let updatedTemplate = Object.assign({}, getTemplateByIdQuery.data, {
      title: draftTitle,
      assistantPersonaId: draftAssistantPersonaId,
      userPersonaId: draftUserPersonaId,
      items: draftTemplateItems,
    });

    updateTemplateMutation.mutate(updatedTemplate);
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setDraftTemplateItems(getTemplateByIdQuery.data!.items);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {};

  const personasMissing =
    !template.assistantPersonaId || !template.userPersonaId;

  return (
    <Stack>
      <Stack>
        <Group justify="space-between">
          <Group flex={1}>
            {!isEditing && (
              <Button
                variant="gradient"
                disabled={personasMissing}
                onClick={() => {
                  startConversationMutation.mutate(template.id, {
                    onSuccess(data) {
                      nav({
                        to: "/conversations/$conversationId",
                        params: {
                          conversationId: data.id,
                        },
                      });
                    },
                  });
                }}
              >
                Chat
              </Button>
            )}

            {isEditing ? (
              <Group gap="xs" flex={1}>
                <Text fw="bold" size="lg" mb={0} mt={0}>
                  Title:
                </Text>
                <TextInput
                  size="sm"
                  flex={1}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </Group>
            ) : (
              <Text fw="bold" size="lg">
                Template: {draftTitle ?? template.id}
              </Text>
            )}
          </Group>
          <Buttons
            isEditing={isEditing}
            handleCancel={handleCancel}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleDelete={handleDelete}
          />
        </Group>

        <Divider label={"Personas"} labelPosition="left" mt="md" mb="md" />

        <Group gap="xl">
          <Group gap="xs">
            <ThemeIcon variant="subtle">
              <IconRobot stroke={1.5} color="white" />
            </ThemeIcon>
            {isEditing ? (
              <Select
                size="md"
                data={getPersonasQuery.data?.map((persona) => ({
                  value: persona.id,
                  label: persona.name,
                }))}
                value={draftAssistantPersonaId}
                onChange={(newId) => {
                  setDraftAssistantPersonaId(newId);
                }}
              />
            ) : (
              <Link
                to="/personas/$personaId"
                params={{
                  personaId: draftAssistantPersonaId ?? "",
                }}
              >
                {
                  getPersonasQuery.data?.find(
                    (persona) => persona.id === draftAssistantPersonaId,
                  )?.name
                }
              </Link>
            )}
          </Group>

          <Group>
            <ThemeIcon variant="subtle">
              <IconUser stroke={1.5} color="white" />
            </ThemeIcon>
            {isEditing ? (
              <Select
                size="md"
                data={getPersonasQuery.data?.map((persona) => ({
                  value: persona.id,
                  label: persona.name,
                }))}
                value={draftUserPersonaId}
                onChange={(newId) => {
                  setDraftUserPersonaId(newId);
                }}
              />
            ) : (
              <Link
                to="/personas/$personaId"
                params={{
                  personaId: draftUserPersonaId ?? "",
                }}
              >
                {
                  getPersonasQuery.data?.find(
                    (persona) => persona.id === draftUserPersonaId,
                  )?.name
                }
              </Link>
            )}
          </Group>
        </Group>

        {personasMissing && (
          <Alert title="Personas Required" color="red">
            An assistant and user persona are required to start a conversation.
            Click edit button to assign personas.
          </Alert>
        )}

        <Divider label={"Blocks"} labelPosition="left" mt="md" mb="md" />

        <Stack gap="xs">
          <DividerBar
            index={-1}
            isEditing={isEditing}
            patchItemsWithInsertAt={patchItemsWithInsertAt(patchItems)}
            setAt={setAt}
            open={open}
          />
          {draftTemplateItems.length > 0 ? (
            draftTemplateItems.map((item, index) => {
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
                                    isMessageItem(draft) &&
                                    isMessageItem(patch)
                                  ) {
                                    draft.message.role.kind =
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
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
                      setAt={setAt}
                      open={open}
                    />
                  </Stack>
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
                          onChange={(e) =>
                            patchOOCMessage(index, e.target.value)
                          }
                        />
                      ) : (
                        <Text>{item.oOC}</Text>
                      )}
                    </TemplateBlock>

                    <DividerBar
                      index={index}
                      isEditing={isEditing}
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
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
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
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
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
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
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
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
                      patchItemsWithInsertAt={patchItemsWithInsertAt(
                        patchItems,
                      )}
                      setAt={setAt}
                      open={open}
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
              setAt={setAt}
              open={open}
              onClickAdd={() => {
                setIsEditing(true);
              }}
            />
          )}
        </Stack>
      </Stack>

      <ConversationPreviewDrawer
        opened={opened}
        close={close}
        templateByIdItems={getTemplateByIdQuery.data!.items}
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
    </Stack>
  );
}
