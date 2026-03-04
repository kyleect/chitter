import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { useStringDownload } from "@/hooks/useDownload";
import { slugify } from "@/lib/slugify";
import { useStartConversationMutation } from "@/queries/conversations";
import { useGetPersonasQuery } from "@/queries/personas";
import {
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetTemplatesQuery,
} from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDownload, IconX } from "@tabler/icons-react";
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
  const deleteTemplateMutation = useDeleteTemplateMutation();
  const download = useStringDownload();

  if (templatesQuery.isPending && getPersonasQuery.isPending) {
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
          <Card p="sm" key={template.id}>
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
                <ActionIcon.Group>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      download(
                        JSON.stringify(template),
                        `${slugify(template.title)}-template_${template.id}.json`,
                      );
                    }}
                  >
                    <IconDownload />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      modals.openConfirmModal({
                        title: "Delete Template",
                        labels: {
                          confirm: "Delete",
                          cancel: "Cancel",
                        },
                        confirmProps: {
                          color: "red",
                        },
                        onConfirm() {
                          deleteTemplateMutation.mutate(template.id);
                        },
                      });
                    }}
                  >
                    <IconX />
                  </ActionIcon>
                </ActionIcon.Group>
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
