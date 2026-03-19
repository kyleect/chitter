import { useStringDownload } from "@/hooks/useDownload";
import { slugify } from "@/lib/slugify";
import { useStartConversationMutation } from "@/queries/conversations";
import { useGetPersonasQuery } from "@/queries/personas";
import {
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetTemplatesQuery,
  useUpdateTemplateByIdMutation,
} from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  FileButton,
  Group,
  JsonInput,
  Loader,
  Stack,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconUpload, IconX } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConversationTemplate } from "server-types";

export const Route = createFileRoute("/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const templatesQuery = useGetTemplatesQuery();
  const [draftName, setDraftName] = useState("");
  const createTemplateMutation = useCreateTemplateMutation();
  const updateTemplateMutation = useUpdateTemplateByIdMutation();
  const getPersonasQuery = useGetPersonasQuery();
  const nav = Route.useNavigate();
  const startConversationMutation = useStartConversationMutation();
  const deleteTemplateMutation = useDeleteTemplateMutation();
  const download = useStringDownload();
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(
    null,
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedTemplate, setUploadedTemplate] =
    useState<ConversationTemplate | null>();

  useEffect(() => {
    if (!uploadedFileContent) return;

    (async () => {
      const template: ConversationTemplate = JSON.parse(
        uploadedFileContent ?? "{}",
      );

      setUploadedTemplate(template);

      setDraftName(template.title ?? "");
    })();
  }, [uploadedFileContent]);

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
        const missingPersonas =
          template.assistantPersona === null || template.userPersona === null;

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
                {missingPersonas && (
                  <Alert title="Missing Personas" color="yellow" p="xs">
                    This template is missing one or both personas
                  </Alert>
                )}
                <Button
                  variant="gradient"
                  disabled={missingPersonas}
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
        <Stack>
          <Group>
            <Button.Group>
              <FileButton
                onChange={(uploadedFile) => {
                  uploadedFile?.text().then(setUploadedFileContent);
                  setUploadedFileName(uploadedFile?.name ?? null);
                }}
                accept="application/json"
              >
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
            <TextInput
              flex={1}
              value={draftName}
              size="md"
              placeholder="Template Name"
              autoFocus
              onChange={(e) => setDraftName(e.target.value)}
            />

            <Button.Group>
              {!uploadedTemplate && (
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
              )}

              {uploadedTemplate && (
                <Button
                  onClick={() => {
                    updateTemplateMutation.mutate(uploadedTemplate, {
                      onError() {
                        notifications.show({
                          color: "red",
                          message: "Error saving uploaded template",
                        });
                      },
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
                  Save
                </Button>
              )}
            </Button.Group>
          </Group>

          {uploadedTemplate && (
            <Stack mt="lg" gap="xs">
              <Badge color="gray" variant="transparent">
                {uploadedFileName}
              </Badge>
              <JsonInput
                autosize
                value={uploadedFileContent ?? undefined}
                formatOnBlur
                onChange={(newValue) => {
                  setUploadedFileContent(newValue);
                }}
              />
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
