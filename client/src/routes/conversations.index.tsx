import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { useGetConservationsQuery } from "@/queries/conversations";
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
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/conversations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getConversationsQuery = useGetConservationsQuery();
  const getPersonasQuery = useGetPersonasQuery();
  const getTemplatesQuery = useGetTemplatesQuery();

  if (
    getConversationsQuery.isLoading &&
    getPersonasQuery.isLoading &&
    getTemplatesQuery.isLoading
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

        console.log({
          templates: getTemplatesQuery.data,
          template: template,
          conversation,
        });

        return (
          <Card>
            <Group justify="space-between">
              <Link
                to="/conversations/$conversationId"
                params={{
                  conversationId: conversation.id,
                }}
              >
                {conversation.title ?? conversation.id}
              </Link>

              <Group gap="xl">
                <Group gap="md">
                  <Text fw="bold" mb={0}>
                    Template:
                  </Text>

                  {template && (
                    <Link
                      to="/templates/$templateId"
                      params={{
                        templateId: template?.id,
                      }}
                    >
                      {template?.title ?? template?.id}
                    </Link>
                  )}
                </Group>

                <ConversationPersonas
                  userPersona={user}
                  assistantPersona={assistant}
                />

                <CloseButton />
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
