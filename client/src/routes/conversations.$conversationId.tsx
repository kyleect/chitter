import { LinkToTemplate } from "@/components/common/LinkToTemplate";
import { ConversationContext } from "@/components/routes/conversations.$conversationId/ConversationContext";
import { MessageList } from "@/components/routes/conversations.$conversationId/MessageList";
import { UserReplyForm } from "@/components/routes/conversations.$conversationId/UserReplyForm";
import { useCompletionMutation } from "@/queries/completions";
import {
  useGetConservationByIdQuery,
  useUpdateConversationMutation,
} from "@/queries/conversations";
import { useGetPersonaByIdQuery } from "@/queries/personas";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Group,
  HoverCard,
  Loader,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useScrollIntoView } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconPlus } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
import { useState } from "react";
import { Message } from "server-types";
import { useStringDownload } from "@/hooks/useDownload";
import { slugify } from "@/lib/slugify";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { useGetInsertablesQuery } from "@/queries/insertables";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const [isEditingMessageIndex, setIsEditingMessageIndex] = useState<
    number | null
  >(null);
  const params = Route.useParams();
  const getInsertablesQuery = useGetInsertablesQuery();
  const completionMutation = useCompletionMutation(params.conversationId);
  const getConversationQuery = useGetConservationByIdQuery(
    params.conversationId,
  );

  const getTemplateByIdQuery = useGetTemplateByIdQuery(
    getConversationQuery.data?.templateId ?? null,
  );

  const getAssistantPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.assistantPersonaId ?? null,
  );

  const getUserPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.userPersonaId ?? null,
  );

  const updateConversationMutation = useUpdateConversationMutation();
  const download = useStringDownload();

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLTextAreaElement>({
    offset: 0,
    duration: 10,
  });

  if (
    getConversationQuery.isPending &&
    getTemplateByIdQuery.isPending &&
    getAssistantPersonaQuery.isPending &&
    getUserPersonaQuery.isPending &&
    getInsertablesQuery.isPending
  ) {
    return <Loader />;
  }

  if (getConversationQuery.isError) {
    return <Alert color="red">Failed to fetch conversation</Alert>;
  }

  if (getTemplateByIdQuery.isError) {
    return <Alert color="red">Failed to fetch template</Alert>;
  }

  if (getAssistantPersonaQuery.isError) {
    return <Alert color="red">Failed to assistant persona</Alert>;
  }

  if (getUserPersonaQuery.isError) {
    return <Alert color="red">Failed to user persona</Alert>;
  }

  if (getInsertablesQuery.isError) {
    return <Alert color="red">Failed to fetch insertables</Alert>;
  }

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
        message: message_processed,
      });
    }, getConversationQuery.data)();

    updateConversation && updateConversationMutation.mutate(updateConversation);
  };

  const handleUpdatedMessage = (
    messageIndex: number,
    updatedMessage: Message,
  ) => {
    notifications.show({
      message: "Message updated!",
    });

    const updateConversation = produce((draft) => {
      if (draft === null || typeof draft === "undefined") return;

      draft.messages[messageIndex] = updatedMessage;
    }, getConversationQuery.data)();

    updateConversation && updateConversationMutation.mutate(updateConversation);
  };

  const handleDeletedMessage = (messageIndex: number) => {
    notifications.show({
      message: "Message deleted!",
    });

    const updatedConversation = produce((draft) => {
      if (draft === null || typeof draft === "undefined") return;

      draft.messages.splice(messageIndex, 1);
    }, getConversationQuery.data)();

    updatedConversation &&
      updateConversationMutation.mutate(updatedConversation);
  };

  return (
    <Stack gap="xs">
      <ConversationContext
        value={{
          editingMessageIndexState: [
            isEditingMessageIndex,
            setIsEditingMessageIndex,
          ],
        }}
      >
        <MessageList
          messages={getConversationQuery.data?.messages ?? []}
          assistantPersona={getAssistantPersonaQuery.data}
          userPersona={getUserPersonaQuery.data}
          onMessageChange={handleUpdatedMessage}
          onMessageDelete={handleDeletedMessage}
        />

        <UserReplyForm
          ref={targetRef}
          isLoading={completionMutation.isPending}
          value={reply}
          onChange={setReply}
          onSubmit={() => {
            completionMutation.mutate(reply, {
              onSuccess() {
                setReply("");
                scrollIntoView();
              },
            });
          }}
        />

        <Group justify="space-between">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              download(
                JSON.stringify(getConversationQuery.data),
                `${slugify(getConversationQuery.data?.title)}-conversation_${getConversationQuery.data?.id}.json`,
              );
            }}
          >
            <IconDownload />
          </ActionIcon>

          {getConversationQuery.data && (
            <Group m={0}>
              <Text mb={0}>Template:</Text>

              <LinkToTemplate
                templateId={getConversationQuery.data.templateId}
              />
            </Group>
          )}
        </Group>

        <Group align="top">
          <Stack flex={1}>
            <Divider label="Template Insertables" />

            <Group>
              <Button
                mr="md"
                size="compact-xs"
                color="violet"
                disabled={
                  !!isEditingMessageIndex || completionMutation.isPending
                }
                onClick={() => {
                  handleInsertInsertable("");
                }}
                leftSection={
                  <ThemeIcon size="compact-xs" color="violet">
                    <IconPlus />
                  </ThemeIcon>
                }
              >
                New
              </Button>
              {(getTemplateByIdQuery.data?.insertableSystemPrompts ?? []).map(
                ([key, value]) => (
                  <HoverCard width={280} shadow="md">
                    <HoverCard.Target>
                      <Button
                        size="compact-xs"
                        color="violet"
                        variant="subtle"
                        disabled={
                          !!isEditingMessageIndex ||
                          completionMutation.isPending
                        }
                        onClick={() => {
                          if (value) handleInsertInsertable(value);
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
            <Divider label="Global Insertables" />

            <Group>
              {(getInsertablesQuery.data ?? []).map(([key, value]) => (
                <HoverCard width={280} shadow="md">
                  <HoverCard.Target>
                    <Button
                      size="compact-xs"
                      color="violet"
                      variant="subtle"
                      disabled={
                        !!isEditingMessageIndex || completionMutation.isPending
                      }
                      onClick={() => {
                        if (value) handleInsertInsertable(value);
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
      </ConversationContext>
    </Stack>
  );
}
