import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { LinkToConversation } from "@/components/common/LinkToConversation";
import { LinkToTemplate } from "@/components/common/LinkToTemplate";
import { useStringDownload } from "@/hooks/useDownload";
import { slugify } from "@/lib/slugify";
import {
  useDeleteConversationMutation,
  useGetConservationsQuery,
  useStartConversationMutation,
} from "@/queries/conversations";
import { useGetPersonasQuery } from "@/queries/personas";
import { useGetTemplatesQuery } from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Code,
  FileButton,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconUpload, IconX } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Conversation } from "server-types";

export const Route = createFileRoute("/conversations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [draftName, setDraftName] = useState("");
  const getConversationsQuery = useGetConservationsQuery();
  const getPersonasQuery = useGetPersonasQuery();
  const getTemplatesQuery = useGetTemplatesQuery();
  const deleteConversationMutation = useDeleteConversationMutation();
  const download = useStringDownload();
  const [file, setFile] = useState<File | null>(null);
  const [uploadedConversation, setUploadedConversation] =
    useState<Conversation | null>();
  const nav = Route.useNavigate();
  const startConversationMutation = useStartConversationMutation();

  useEffect(() => {
    if (!file) return;

    (async () => {
      const conversation: Conversation = JSON.parse(
        (await file?.text()) ?? "{}",
      );

      setUploadedConversation(conversation);

      setDraftName(conversation.title ?? "");
    })();
  }, [file]);

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

                <ActionIcon.Group>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      download(
                        JSON.stringify(conversation),
                        `${slugify(conversation.title)}-conversation_${conversation.id}.json`,
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
        <Stack>
          <Group>
            <Button.Group>
              <FileButton onChange={setFile} accept="application/json">
                {(props) => (
                  <Button
                    leftSection={
                      <ThemeIcon size="xs">
                        <IconUpload />
                      </ThemeIcon>
                    }
                    {...props}
                  >
                    Upload
                  </Button>
                )}
              </FileButton>
            </Button.Group>
            {uploadedConversation && (
              <>
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
                      startConversationMutation.mutate(
                        uploadedConversation.templateId,
                        {
                          onError() {
                            notifications.show({
                              color: "red",
                              message: "Error saving uploaded conversation",
                            });
                          },
                          onSuccess(data) {
                            nav({
                              to: "/conversations/$conversationId",
                              params: {
                                conversationId: data.id,
                              },
                            });
                          },
                        },
                      );
                    }}
                  >
                    Save
                  </Button>
                </Button.Group>
              </>
            )}
          </Group>

          {uploadedConversation && (
            <Stack mt="lg" gap="xs">
              <Badge color="gray" variant="transparent">
                {file?.name}
              </Badge>
              <Code block>{JSON.stringify(uploadedConversation, null, 2)}</Code>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
