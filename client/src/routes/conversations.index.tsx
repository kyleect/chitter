import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { LinkToConversation } from "@/components/common/LinkToConversation";
import { LinkToTemplate } from "@/components/common/LinkToTemplate";
import {
  useDeleteConversationMutation,
  useGetConservationsQuery,
} from "@/queries/conversations";
import { useGetPersonasQuery } from "@/queries/personas";
import { useGetTemplatesQuery } from "@/queries/templates";
import {
  Alert,
  Card,
  CloseButton,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conversations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getConversationsQuery = useGetConservationsQuery();
  const getPersonasQuery = useGetPersonasQuery();
  const getTemplatesQuery = useGetTemplatesQuery();
  const deleteConversationMutation = useDeleteConversationMutation();

  if (
    getConversationsQuery.isPending &&
    getPersonasQuery.isPending &&
    getTemplatesQuery.isPending
  ) {
    return <Loader />;
  }

  if (getConversationsQuery.isError) {
    return (
      <Alert color="red">
        There was an error loading conversations:{" "}
        {JSON.stringify(getConversationsQuery.error)}
      </Alert>
    );
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        There was an error loading personas:{" "}
        {JSON.stringify(getPersonasQuery.error)}
      </Alert>
    );
  }

  if (getTemplatesQuery.isError) {
    return (
      <Alert color="red">
        There was an error loading templates:{" "}
        {JSON.stringify(getTemplatesQuery.error)}
      </Alert>
    );
  }

  return (
    <Stack>
      {getConversationsQuery.data?.map((conversation) => {
        const user = getPersonasQuery.data?.find(
          (persona) => persona.id === conversation.userPersonaId,
        );
        const assistant = getPersonasQuery.data?.find(
          (persona) => persona.id === conversation.assistantPersonaId,
        );

        const template = getTemplatesQuery.data?.find(
          (template) => template.id === conversation.templateId,
        );

        return (
          <Card key={conversation.id}>
            <Group justify="space-between">
              <LinkToConversation conversationId={conversation.id} />

              <Group gap="xl">
                <Group gap="md">
                  <Text fw="bold" mb={0}>
                    Template:
                  </Text>

                  {template && <LinkToTemplate templateId={template.id} />}
                </Group>

                <ConversationPersonas
                  userPersona={user}
                  assistantPersona={assistant}
                />

                <CloseButton
                  onClick={() => {
                    modals.openConfirmModal({
                      title: "Delete Conversation",
                      labels: {
                        confirm: "Delete",
                        cancel: "Cancel",
                      },
                      confirmProps: {
                        color: "red",
                      },
                      onConfirm() {
                        deleteConversationMutation.mutate(conversation.id);
                      },
                    });
                  }}
                />
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
