import { ConversationContext } from "@/components/routes/conversations.$conversationId/ConversationContext";
import { MessageList } from "@/components/routes/conversations.$conversationId/MessageList";
import { UserReplyForm } from "@/components/routes/conversations.$conversationId/UserReplyForm";
import {
  COMPLETION_KEYS,
  useChatCompletionMutation,
  useCompletionMutation,
  useGenerateResponseMutation,
} from "@/queries/completions";
import {
  useForkConversationByIdMutation,
  useGetConservationByIdQuery,
  useUpdateConversationMutation,
} from "@/queries/conversations";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Button,
  Code,
  Divider,
  Group,
  HoverCard,
  Loader,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useScrollIntoView } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconDeviceFloppy,
  IconDownload,
  IconEdit,
  IconGitFork,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
import { useEffect, useState } from "react";
import { Conversation, Message } from "server-types";
import { useStringDownload } from "@/hooks/useDownload";
import { slugify } from "@/lib/slugify";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { useGetInsertablesQuery } from "@/queries/insertables";
import { useMutationState } from "@tanstack/react-query";
import { modals } from "@mantine/modals";
import { useGetSettingsQuery } from "@/queries/settings";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const [sendWithMessage, setSendWithMessage] = useState("");
  const [doSendWithNextMessage, setDoSendWithNextMessage] = useState(false);
  const forkConversationMutation = useForkConversationByIdMutation();
  const [isEditingMessageIndex, setIsEditingMessageIndex] = useState<
    number | null
  >(null);
  const [systemMessagesAreVisible, setSystemMessagesAreVisible] =
    useState<boolean>(false);
  const params = Route.useParams();
  const getInsertablesQuery = useGetInsertablesQuery();
  const chatCompletionMutation = useChatCompletionMutation(
    params.conversationId,
  );
  const generateResponseMutation = useGenerateResponseMutation(
    params.conversationId,
  );
  const renameConversationCompletionMutation = useCompletionMutation(
    "rename-conversation",
  );
  const [draftConversationTitle, setDraftConversationTitle] =
    useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const nav = Route.useNavigate();

  const regenerateMutations = useMutationState({
    filters: {
      mutationKey: COMPLETION_KEYS.regeneration(params.conversationId),
      status: "pending",
    },

    select(mutation) {
      return mutation.state;
    },
  });

  const addMoreDetailsCompletionMutations = useMutationState({
    filters: {
      mutationKey: COMPLETION_KEYS.completion("add-more-details"),
      status: "pending",
    },

    select(mutation) {
      return mutation.state;
    },
  });

  const renameTitleCompletionMutations = useMutationState({
    filters: {
      mutationKey: COMPLETION_KEYS.completion("rename-conversation"),
      status: "pending",
    },

    select(mutation) {
      return mutation.state;
    },
  });

  const chatImpersonationCompletionMutations = useMutationState({
    filters: {
      mutationKey: COMPLETION_KEYS.chat_impersonation(params.conversationId),
      status: "pending",
    },

    select(mutation) {
      return mutation.state;
    },
  });

  const getConversationQuery = useGetConservationByIdQuery(
    params.conversationId,
  );

  useEffect(() => {
    if (!getConversationQuery.data) return;

    setDraftConversationTitle(getConversationQuery.data.title ?? "");
  }, [getConversationQuery.data]);

  const getTemplateByIdQuery = useGetTemplateByIdQuery(
    getConversationQuery.data?.templateId ?? null,
  );

  const getSettingsQuery = useGetSettingsQuery();

  const updateConversationMutation = useUpdateConversationMutation();
  const download = useStringDownload();

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLTextAreaElement>({
    offset: 0,
    duration: 10,
  });

  if (
    getConversationQuery.isPending ||
    getTemplateByIdQuery.isPending ||
    getInsertablesQuery.isPending ||
    getSettingsQuery.isPending
  ) {
    return <Loader />;
  }

  if (getConversationQuery.isError) {
    return <Alert color="red">Failed to fetch conversation</Alert>;
  }

  if (getTemplateByIdQuery.isError) {
    return <Alert color="red">Failed to fetch template</Alert>;
  }

  if (getInsertablesQuery.isError) {
    return <Alert color="red">Failed to fetch insertables</Alert>;
  }

  if (getSettingsQuery.isError) {
    return <Alert color="red">Failed to fetch settings</Alert>;
  }

  const conversation = getConversationQuery.data;

  const handleInsertInsertable = (message: string) => {
    notifications.show({
      message: "Message updated!",
    });

    let message_processed = message;

    const updateConversation = produce((draft) => {
      draft?.messages.push({
        kind: "Message",
        role: {
          kind: "system",
        },
        content: message_processed,
      });
    }, getConversationQuery.data)();

    updateConversation && updateConversationMutation.mutate(updateConversation);
  };

  const handleUpdatedMessage = (
    messageIndex: number,
    updatedMessage: Message,
  ) => {
    const updateConversation = produce(getConversationQuery.data, (draft) => {
      if (draft === null || typeof draft === "undefined") return;

      draft.messages[messageIndex] = updatedMessage;

      return draft;
    });

    updateConversation &&
      updateConversationMutation.mutate(updateConversation, {
        onError() {
          notifications.show({
            message: "Unable to update message.",
            color: "red",
          });
        },
        onSuccess() {
          notifications.show({
            message: "Message updated!",
          });
        },
      });
  };

  const handleDeletedMessage = (messageIndex: number) => {
    notifications.show({
      message: "Message deleted!",
    });

    const updatedConversation = produce((draft) => {
      if (draft === null || typeof draft === "undefined") return;

      draft.messages.splice(messageIndex, 1);
    }, conversation)();

    updatedConversation &&
      updateConversationMutation.mutate(updatedConversation);
  };

  const isGenerating =
    chatCompletionMutation.isPending ||
    regenerateMutations.length > 0 ||
    addMoreDetailsCompletionMutations.length > 0 ||
    renameTitleCompletionMutations.length > 0 ||
    chatImpersonationCompletionMutations.length > 0 ||
    generateResponseMutation.isPending;

  const isTheUsersTurn = conversation && getIsItUserTurn(conversation);

  return (
    <Stack gap="xs">
      <ConversationContext
        value={{
          conversation: getConversationQuery.data!,
          editingMessageIndexState: [
            isEditingMessageIndex,
            setIsEditingMessageIndex,
          ],
          systemMessagesAreVisibleState: [
            systemMessagesAreVisible,
            setSystemMessagesAreVisible,
          ],
          isGenerating,
        }}
      >
        <MessageList
          messages={conversation?.messages ?? []}
          assistantPersona={conversation?.assistantPersona}
          userPersona={conversation?.userPersona}
          onMessageChange={handleUpdatedMessage}
          onMessageDelete={handleDeletedMessage}
        />

        <Group justify="space-between" mt="xl">
          <Switch
            label="Show System Messages"
            checked={systemMessagesAreVisible}
            disabled={isGenerating}
            color="violet"
            onChange={(event) =>
              setSystemMessagesAreVisible(event.currentTarget.checked)
            }
          />
          <ActionIcon.Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              disabled={isGenerating || conversation?.messages?.length === 0}
              onClick={() => {
                if (!conversation) return;

                forkConversationMutation.mutate(
                  { conversationId: conversation.id },
                  {
                    onSuccess(newConversation) {
                      nav({
                        to: "/conversations/$conversationId",
                        params: {
                          conversationId: newConversation.id,
                        },
                      });
                    },
                  },
                );
              }}
            >
              <IconGitFork />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              disabled={isGenerating || conversation?.messages?.length === 0}
              onClick={() => {
                download(
                  JSON.stringify(getConversationQuery.data),
                  `${slugify(conversation?.title)}-conversation_${conversation?.id}.json`,
                );
              }}
            >
              <IconDownload />
            </ActionIcon>
          </ActionIcon.Group>
        </Group>

        {isTheUsersTurn ? (
          <UserReplyForm
            ref={targetRef}
            isLoading={isGenerating}
            value={reply}
            onChange={setReply}
            onSubmit={() => {
              const backupReply = `${reply}`;

              chatCompletionMutation.mutate(
                { prompt: reply, systemMessageAfterPrompt: sendWithMessage },
                {
                  onSuccess() {
                    setReply("");
                    setSendWithMessage("");
                    setDoSendWithNextMessage(false);
                    scrollIntoView();
                  },
                  onError() {
                    setReply(backupReply);

                    notifications.show({
                      color: "red",
                      message: `Error generating completion`,
                    });
                  },
                },
              );
            }}
          />
        ) : (
          <Button.Group>
            <Button
              variant="gradient"
              onClick={() => {
                generateResponseMutation.mutate();
              }}
              loading={isGenerating}
            >
              Generate Response
            </Button>
          </Button.Group>
        )}

        {conversation && (
          <Group justify="space-between">
            <Group gap="xs">
              <Text mb={0} size="sm">
                Conversation:
              </Text>

              {isEditingTitle ? (
                <TextInput
                  value={draftConversationTitle}
                  onChange={(e) => {
                    setDraftConversationTitle(e.target.value);
                  }}
                  disabled={isGenerating}
                />
              ) : (
                <Text mb={0} size="sm">
                  {draftConversationTitle}
                </Text>
              )}

              {isEditingTitle ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  disabled={isGenerating}
                  onClick={() => {
                    setIsEditingTitle(false);

                    const updateConversation = produce((draft) => {
                      if (!draft) return draft;

                      draft.title = draftConversationTitle;

                      return draft;
                    }, getConversationQuery.data)();

                    if (updateConversation) {
                      updateConversationMutation.mutate(updateConversation);
                    }
                  }}
                >
                  <IconDeviceFloppy />
                </ActionIcon>
              ) : (
                <>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    disabled={isGenerating}
                    onClick={() => {
                      setIsEditingTitle(true);
                    }}
                  >
                    <IconEdit />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    disabled={isGenerating}
                    onClick={() => {
                      const renameConversationPrompt =
                        getSettingsQuery.data.conversation_settings
                          .rename_conversation_prompt ?? "";

                      const messages = conversation.messages
                        .slice(0, 4)
                        .map((x) => `${x.content}\n`)
                        .join("\n");

                      const prompt = renameConversationPrompt.replace(
                        "{{INPUT}}",
                        messages,
                      );

                      renameConversationCompletionMutation.mutate(
                        {
                          prompt,
                          params: {
                            max_tokens: 15,
                            temperature: 0.2,
                          },
                        },
                        {
                          onSuccess(data) {
                            const newConversationTitle = data;

                            modals.openConfirmModal({
                              title: "Update title?",
                              children: <Text>{newConversationTitle}</Text>,
                              onConfirm() {
                                notifications.show({
                                  message: `Title updated to ${newConversationTitle}`,
                                });
                              },
                            });
                          },
                        },
                      );
                    }}
                  >
                    <IconSparkles />
                  </ActionIcon>
                </>
              )}
            </Group>
          </Group>
        )}

        <Divider label="Insertables" />

        {isTheUsersTurn && (
          <Group align="flex-start">
            <Switch
              flex={1}
              label="Send with next message"
              disabled={isGenerating}
              checked={doSendWithNextMessage}
              onChange={(e) => {
                if (!e.target.checked) {
                  setSendWithMessage("");
                }
                setDoSendWithNextMessage(e.target.checked);
              }}
            />

            <Textarea
              placeholder="System message to send after the reply"
              autosize
              minRows={1}
              flex={4}
              style={{
                visibility: doSendWithNextMessage ? "visible" : "hidden",
              }}
              value={sendWithMessage}
              onChange={(e) => setSendWithMessage(e.target.value)}
            />
          </Group>
        )}

        <Group align="top" mt="md">
          <Stack flex={1}>
            <Divider label="From Template" />

            <Group>
              {!doSendWithNextMessage && (
                <Button
                  mr="md"
                  size="compact-xs"
                  color="violet"
                  disabled={!!isEditingMessageIndex || isGenerating}
                  onClick={() => {
                    if (doSendWithNextMessage) {
                      setSendWithMessage("");
                    } else {
                      setSystemMessagesAreVisible(true);
                      handleInsertInsertable("");
                    }
                  }}
                  leftSection={
                    <ThemeIcon size="compact-xs" color="violet">
                      <IconPlus />
                    </ThemeIcon>
                  }
                >
                  New
                </Button>
              )}
              {(conversation?.insertableSystemPrompts ?? []).map(
                ([key, value]) => (
                  <HoverCard width={280} shadow="md">
                    <HoverCard.Target>
                      <Button
                        size="compact-xs"
                        color="violet"
                        variant="subtle"
                        disabled={!!isEditingMessageIndex || isGenerating}
                        onClick={() => {
                          if (doSendWithNextMessage) {
                            setSendWithMessage(value);
                          } else {
                            setSystemMessagesAreVisible(true);
                            handleInsertInsertable(value);
                          }
                        }}
                      >
                        {key}
                      </Button>
                    </HoverCard.Target>
                    <HoverCard.Dropdown>
                      <TextToParagraphs
                        text={value}
                        textProps={{
                          size: "sm",
                        }}
                      />
                    </HoverCard.Dropdown>
                  </HoverCard>
                ),
              )}
            </Group>
          </Stack>

          <Stack flex={1}>
            <Divider label="Global" />

            <Group>
              {(getInsertablesQuery.data ?? []).map(([key, value]) => (
                <HoverCard width={280} shadow="md">
                  <HoverCard.Target>
                    <Button
                      size="compact-xs"
                      color="violet"
                      variant="subtle"
                      disabled={!!isEditingMessageIndex || isGenerating}
                      onClick={() => {
                        if (doSendWithNextMessage) {
                          setSendWithMessage(value);
                        } else {
                          setSystemMessagesAreVisible(true);
                          handleInsertInsertable(value);
                        }
                      }}
                    >
                      {key}
                    </Button>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <TextToParagraphs
                      text={value}
                      textProps={{
                        size: "sm",
                      }}
                    />
                  </HoverCard.Dropdown>
                </HoverCard>
              ))}
            </Group>
          </Stack>
        </Group>

        {conversation?.prompts && (
          <Stack mt="xl">
            <Divider label="Prompts" />

            <Table withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Prompt</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(conversation.prompts).map((value) => {
                  return (
                    <Table.Tr>
                      <Table.Td>
                        <Code>
                          {"{{"}
                          {value[0]}
                          {"}}"}
                        </Code>
                      </Table.Td>
                      <Table.Td>
                        <Code>{JSON.stringify(value[1])}</Code>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </ConversationContext>
    </Stack>
  );
}

function getIsItUserTurn(conversation: Conversation) {
  return (
    conversation?.messages
      .filter((message) => message.role.kind != "system")
      .at(-1)?.role.kind === "assistant"
  );
}
