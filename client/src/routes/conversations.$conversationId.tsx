import { LinkToTemplate } from "@/components/common/LinkToTemplate";
import { MessageList } from "@/components/routes/conversations.$conversationId/MessageList";
import { UserReplyForm } from "@/components/routes/conversations.$conversationId/UserReplyForm";
import { useCompletionMutation } from "@/queries/completions";
import { useGetConservationByIdQuery } from "@/queries/conversations";
import { useGetPersonaByIdQuery } from "@/queries/personas";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import { useScrollIntoView } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const params = Route.useParams();
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

  return (
    <Stack gap="xl">
      <MessageList
        messages={getConversationQuery.data?.messages ?? []}
        assistantPersona={getAssistantPersonaQuery.data}
        userPersona={getUserPersonaQuery.data}
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

      {getConversationQuery.data && (
        <Group m={0}>
          <Text mb={0}>Template:</Text>

          <LinkToTemplate templateId={getConversationQuery.data.templateId} />
        </Group>
      )}
    </Stack>
  );
}
