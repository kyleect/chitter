import { MessageList } from "@/components/routes/conversations.$conversationId/MessageList";
import { UserReplyForm } from "@/components/routes/conversations.$conversationId/UserReplyForm";
import { useGetConservationByIdQuery } from "@/queries/conversations";
import { useGetPersonaByIdQuery } from "@/queries/personas";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import { Alert, Loader, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const params = Route.useParams();
  const getConversationQuery = useGetConservationByIdQuery(
    params.conversationId,
  );

  const getTemplateByIdQuery = useGetTemplateByIdQuery(
    getConversationQuery.data?.templateId,
  );

  const getAssistantPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.assistantPersonaId,
  );

  const getUserPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.userPersonaId,
  );

  if (
    getConversationQuery.isLoading &&
    getTemplateByIdQuery.isLoading &&
    getAssistantPersonaQuery.isLoading &&
    getUserPersonaQuery.isLoading
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
      <MessageList messages={getConversationQuery.data?.messages ?? []} />

      <UserReplyForm value={reply} onChange={setReply} />
    </Stack>
  );
}
