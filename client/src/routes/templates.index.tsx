import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { useStartConversationMutation } from "@/queries/conversations";
import { useGetPersonasQuery } from "@/queries/personas";
import {
  useCreateTemplateMutation,
  useGetTemplatesQuery,
} from "@/queries/templates";
import {
  Alert,
  Button,
  Card,
  CloseButton,
  Group,
  Loader,
  Stack,
  TextInput,
} from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const templatesQuery = useGetTemplatesQuery();
  const [draftName, setDraftName] = useState("");
  const createTemplateMutation = useCreateTemplateMutation();
  const getPersonasQuery = useGetPersonasQuery();
  const nav = Route.useNavigate();
  const startConversationMutation = useStartConversationMutation();

  if (templatesQuery.isLoading && getPersonasQuery) {
    return <Loader />;
  }

  if (templatesQuery.isError) {
    return (
      <Alert color="red">
        Failed to load templates: {JSON.stringify(templatesQuery.error)}
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

  return (
    <Stack>
      {templatesQuery.data?.map((template) => {
        const assistantPersona = getPersonasQuery.data?.find(
          (persona) => persona.id === template.assistantPersonaId,
        );

        const userPersona = getPersonasQuery.data?.find(
          (persona) => persona.id === template.userPersonaId,
        );

        return (
          <Card p="sm">
            <Group justify="space-between">
              <Link
                to={`/templates/$templateId`}
                params={{
                  templateId: template.id,
                }}
              >
                {template.title ?? template.id}
              </Link>
              <Group gap="xl">
                <ConversationPersonas
                  assistantPersona={assistantPersona}
                  userPersona={userPersona}
                />
                <Button
                  variant="gradient"
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
                <CloseButton />
              </Group>
            </Group>
          </Card>
        );
      })}

      <Card>
        <Group>
          <TextInput
            flex={1}
            value={draftName}
            size="md"
            placeholder="Template Name"
            autoFocus
            onChange={(e) => setDraftName(e.target.value)}
          />

          <Button.Group>
            <Button
              onClick={() => {
                createTemplateMutation.mutate(draftName, {
                  onSuccess(data) {
                    nav({
                      to: "/templates/$templateId",
                      params: {
                        templateId: data.id,
                      },
                    });
                  },
                });
              }}
            >
              Add
            </Button>
          </Button.Group>
        </Group>
      </Card>
    </Stack>
  );
}
