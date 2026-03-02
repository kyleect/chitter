import { LinkToTemplate } from "@/components/common/LinkToTemplate";
import { MessageList } from "@/components/routes/conversations.$conversationId/MessageList";
import { UserReplyForm } from "@/components/routes/conversations.$conversationId/UserReplyForm";
import {
  useCompletionMutation,
  useGenerateResponseMutation,
  useRegenerateResponseMutation,
} from "@/queries/completions";
import {
  useGetConservationByIdQuery,
  useUpdateConversationMutation,
} from "@/queries/conversations";
import { useGetPersonaByIdQuery } from "@/queries/personas";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import {
  Alert,
  Button,
  ButtonGroup,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useScrollIntoView } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
import { useState } from "react";
import { Message } from "server-types";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const params = Route.useParams();
  const completionMutation = useCompletionMutation(params.conversationId);
  const generateResponseMutation = useGenerateResponseMutation(
    params.conversationId,
  );
  const regenerateResponseMutation = useRegenerateResponseMutation(
    params.conversationId,
  );
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

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLTextAreaElement>({
    offset: 0,
    duration: 10,
  });

  if (
    getConversationQuery.isPending &&
    getTemplateByIdQuery.isPending &&
    getAssistantPersonaQuery.isPending &&
    getUserPersonaQuery.isPending
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

  const lastMessageRole = getConversationQuery.data?.messages.at(-1)?.role.kind;

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
    <Stack gap="xl">
      <MessageList
        messages={getConversationQuery.data?.messages ?? []}
        assistantPersona={getAssistantPersonaQuery.data}
        userPersona={getUserPersonaQuery.data}
        onEditMessage={handleUpdatedMessage}
        onDeleteMessage={handleDeletedMessage}
        onRegenerateMessage={(index) => {
          regenerateResponseMutation.mutate(index);
        }}
      />

      {lastMessageRole === "assistant" ? (
        <UserReplyForm
          ref={targetRef}
          isLoading={
            completionMutation.isPending || regenerateResponseMutation.isPending
          }
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
      ) : (
        <ButtonGroup>
          <Button
            size="md"
            variant="gradient"
            loading={generateResponseMutation.isPending}
            onClick={() => {
              generateResponseMutation.mutate();
            }}
          >
            Generate Response
          </Button>
        </ButtonGroup>
      )}

      {getConversationQuery.data && (
        <Group m={0}>
          <Text mb={0}>Template:</Text>

          <LinkToTemplate templateId={getConversationQuery.data.templateId} />
        </Group>
      )}
    </Stack>
  );
}
