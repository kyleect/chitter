import { AssistantIcon } from "@/components/common/AssistantIcon";
import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { UserIcon } from "@/components/common/UserIcon";
import {
  useCreatePersonaMutation,
  useDeletePersonaMutation,
  useGetPersonaByIdQuery,
  useGetPersonasQuery,
} from "@/queries/personas";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/queries/settings";
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  CloseButton,
  Code,
  FileButton,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconUpload } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/personas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftScenario, setDraftScenario] = useState("");
  const [draftSystemPrompt, setDraftSystemPrompt] = useState("");
  const [draftPersonality, setDraftPersonality] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedCard, setUploadedCard] = useState<any | null>(null);
  const personasQuery = useGetPersonasQuery();
  const createPersonaMutation = useCreatePersonaMutation();
  const deletePersonaMutation = useDeletePersonaMutation();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const getSettingsQuery = useGetSettingsQuery();
  const getAssistantQuery = useGetPersonaByIdQuery(
    getSettingsQuery.data?.default_assistant_persona_id ?? null,
  );
  const getUserQuery = useGetPersonaByIdQuery(
    getSettingsQuery.data?.default_user_persona_id ?? null,
  );

  useEffect(() => {
    if (!uploadedCard) return;

    setDraftName(uploadedCard.card.data.name);
    setDraftDescription(uploadedCard.card.data.description);
    setDraftScenario(uploadedCard.card.data.scenario);
    setDraftSystemPrompt(uploadedCard.card.data.system_prompt);
    setDraftPersonality(uploadedCard.card.data.personality);
  }, [uploadedCard]);

  if (personasQuery.isPending && getSettingsQuery.isPending) {
    return <Loader />;
  }

  if (personasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(personasQuery.error)}
      </Alert>
    );
  }

  if (getSettingsQuery.isError) {
    return (
      <Alert color="red">
        Failed to load settings: {JSON.stringify(getSettingsQuery.error)}
      </Alert>
    );
  }

  const handleAddPersona = () => {
    createPersonaMutation.mutate(
      {
        name: draftName,
        description: draftDescription,
      },
      {
        onSuccess() {
          setDraftName("");
          setDraftDescription("");
          setDraftPersonality("");
          setUploadedFile(null);
          setUploadedCard(null);
        },
      },
    );
  };

  return (
    <Stack>
      <Group gap="xl">
        <Text fw="bold" mb={0}>
          Defaults
        </Text>
        <ConversationPersonas
          assistantPersona={getAssistantQuery.data}
          userPersona={getUserQuery.data}
        />
      </Group>
      {personasQuery.data?.map((persona) => {
        return (
          <Card key={persona.id}>
            <Group justify="space-between">
              <Group>
                <Text>
                  <Link
                    to="/personas/$personaId"
                    params={{
                      personaId: persona.id,
                    }}
                  >
                    {persona.name}
                  </Link>
                </Text>
              </Group>
              <Group>
                <Text
                  mb={0}
                  size="sm"
                  fw={
                    getSettingsQuery.data?.default_assistant_persona_id ===
                      persona.id ||
                    getSettingsQuery.data?.default_user_persona_id ===
                      persona.id
                      ? "bold"
                      : undefined
                  }
                >
                  Default
                </Text>
                <ActionIcon.Group>
                  <ActionIcon
                    variant={
                      getSettingsQuery.data?.default_assistant_persona_id ===
                      persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      updateSettingsMutation.mutate(
                        produce((draft) => {
                          draft.default_assistant_persona_id = persona.id;
                        })(getSettingsQuery.data),
                      );
                    }}
                  >
                    <AssistantIcon />
                  </ActionIcon>
                  <ActionIcon
                    variant={
                      getSettingsQuery.data?.default_user_persona_id ===
                      persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      updateSettingsMutation.mutate(
                        produce((draft) => {
                          draft.default_user_persona_id = persona.id;
                        })(getSettingsQuery.data),
                      );
                    }}
                  >
                    <UserIcon />
                  </ActionIcon>
                </ActionIcon.Group>
                <CloseButton
                  onClick={() => {
                    modals.openConfirmModal({
                      title: "Delete Persona",
                      labels: {
                        confirm: "Delete",
                        cancel: "Cancel",
                      },
                      confirmProps: {
                        color: "red",
                      },
                      onConfirm() {
                        deletePersonaMutation.mutate(persona.id);
                      },
                    });
                  }}
                />
              </Group>
            </Group>
          </Card>
        );
      })}

      <Card>
        <Stack>
          <Group>
            <TextInput
              flex={1}
              value={draftName}
              size="md"
              placeholder="Persona Name"
              autoFocus
              onChange={(e) => setDraftName(e.target.value)}
            />

            <Button.Group>
              <Button onClick={handleAddPersona}>Add</Button>
            </Button.Group>

            {uploadedCard ? (
              <Button
                color="red"
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setUploadedCard(null);
                  setDraftName("");
                  setDraftDescription("");
                  setDraftScenario("");
                  setDraftSystemPrompt("");
                }}
              >
                Cancel
              </Button>
            ) : (
              <FileButton
                onChange={async (file) => {
                  if (!file) return;

                  setUploadedFile(file);

                  const formData = new FormData();
                  formData.append("file", file);

                  const res = await fetch("/api/personas/upload", {
                    method: "POST",
                    body: formData,
                  });

                  const data = await res.json();

                  setUploadedCard(data);

                  console.log(data);
                }}
              >
                {(props) => (
                  <Button
                    variant="subtle"
                    leftSection={
                      <ThemeIcon size="sm" variant="subtle">
                        <IconUpload />
                      </ThemeIcon>
                    }
                    {...props}
                  >
                    Import Character V2
                  </Button>
                )}
              </FileButton>
            )}
          </Group>

          {uploadedCard && (
            <>
              <Text mb={0} fw="bold">
                {uploadedFile?.name}
              </Text>

              <Textarea
                autosize
                label="Description"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
              />

              <Textarea
                autosize
                label="Scenario"
                value={draftScenario}
                onChange={(e) => setDraftScenario(e.target.value)}
              />

              <Textarea
                autosize
                label="System Prompt"
                value={draftSystemPrompt}
                onChange={(e) => setDraftSystemPrompt(e.target.value)}
              />

              <Textarea
                autosize
                label="Personality"
                value={draftPersonality}
                onChange={(e) => setDraftPersonality(e.target.value)}
              />
            </>
          )}
        </Stack>
      </Card>

      {uploadedCard && (
        <Code block>{JSON.stringify(uploadedCard.card.data, null, 2)}</Code>
      )}
    </Stack>
  );
}
