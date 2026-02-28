import { AssistantIcon } from "@/components/common/AssistantIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { useGetPersonasQuery } from "@/queries/personas";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/queries/settings";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
import { useEffect, useState } from "react";
import { AppSettings } from "server-types";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getPersonasQuery = useGetPersonasQuery();

  let getSettingsQuery = useGetSettingsQuery();
  let updateSettingsMutation = useUpdateSettingsMutation();
  let [draftSettings, setDraftSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setDraftSettings(getSettingsQuery.data ?? null);
  }, [getSettingsQuery.data]);

  if (getPersonasQuery.isPending || getSettingsQuery.isPending) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(getPersonasQuery.error)}
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

  function onSave() {
    if (draftSettings === null) return;
    updateSettingsMutation.mutate(draftSettings);
  }

  return (
    <Stack>
      <Button.Group>
        <Button onClick={onSave}>Save</Button>
      </Button.Group>
      <Title order={2}>Settings</Title>
      <Card withBorder shadow="xs">
        <Stack>
          <Title order={3}>Default Personas</Title>
          <Group gap="xl">
            <Group gap="xs">
              <ThemeIcon variant="subtle">
                <AssistantIcon color="white" />
              </ThemeIcon>
              <Select
                size="md"
                data={getPersonasQuery.data?.map((persona) => ({
                  value: persona.id,
                  label: persona.name,
                }))}
                value={draftSettings?.default_assistant_persona_id}
                onChange={(newId) =>
                  setDraftSettings(
                    produce((draft) => {
                      if (draft === null) return null;

                      draft.default_assistant_persona_id = newId;
                    }),
                  )
                }
              />
            </Group>

            <Group>
              <ThemeIcon variant="subtle">
                <UserIcon color="white" />
              </ThemeIcon>
              <Select
                size="md"
                data={getPersonasQuery.data?.map((persona) => ({
                  value: persona.id,
                  label: persona.name,
                }))}
                value={draftSettings?.default_user_persona_id}
                onChange={(newId) =>
                  setDraftSettings(
                    produce((draft) => {
                      if (draft === null) return null;

                      draft.default_user_persona_id = newId;
                    }),
                  )
                }
              />
            </Group>
          </Group>

          {draftSettings?.default_assistant_persona_id === null ||
            (draftSettings?.default_user_persona_id === null && (
              <Alert title="Personas Required" color="red">
                An assistant and user persona are required to start a
                conversation. Click edit button to assign personas.
              </Alert>
            ))}
        </Stack>
      </Card>

      <Card withBorder shadow="xs">
        <Stack>
          <Title order={3}>LLM Connection</Title>

          <TextInput
            label="Host URL"
            required
            value={draftSettings?.connection.url ?? ""}
            onChange={(e) =>
              setDraftSettings(
                produce((draft) => {
                  if (draft === null) return;
                  draft.connection.url = e.target.value;
                }),
              )
            }
          />
          <TextInput label="API Key" />
        </Stack>
      </Card>

      <Card withBorder shadow="xs">
        <Stack>
          <Title order={3}>LLM Parameters</Title>

          <Textarea
            autosize
            minRows={1}
            label="Default System Prompt"
            value={draftSettings?.params.system_prompt ?? ""}
            onChange={(e) => {
              setDraftSettings(
                produce((draft) => {
                  if (draft === null) return;
                  draft.params.system_prompt = e.target.value;
                }),
              );
            }}
          />

          <Group grow>
            <NumberInput
              step={0.1}
              allowNegative={false}
              label="Temperature"
              value={draftSettings?.params.temperature ?? ""}
              onChange={(newTemp) => {
                setDraftSettings(
                  produce((draft) => {
                    if (draft === null) return;

                    switch (typeof newTemp) {
                      case "string":
                        draft.params.temperature = parseFloat(newTemp);
                        break;

                      case "number":
                        draft.params.temperature = newTemp;
                        break;

                      default:
                        break;
                    }
                  }),
                );
              }}
            />
            <NumberInput
              label="Max Tokens"
              allowNegative={false}
              step={1}
              value={draftSettings?.params.max_tokens ?? undefined}
              onChange={(newValue) => {
                setDraftSettings(
                  produce((draft) => {
                    if (draft === null) return;

                    switch (typeof newValue) {
                      case "string":
                        draft.params.max_tokens = parseInt(newValue, 10);
                        break;

                      case "number":
                        draft.params.max_tokens = newValue;
                        break;

                      default:
                        break;
                    }
                  }),
                );
              }}
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Top K"
              allowNegative={false}
              step={1}
              value={draftSettings?.params.top_k ?? undefined}
              onChange={(newValue) => {
                setDraftSettings(
                  produce((draft) => {
                    if (draft === null) return;

                    switch (typeof newValue) {
                      case "string":
                        draft.params.top_k = parseInt(newValue, 10);
                        break;

                      case "number":
                        draft.params.top_k = newValue;
                        break;

                      default:
                        break;
                    }
                  }),
                );
              }}
            />
            <NumberInput
              label="Top P"
              allowNegative={false}
              step={0.01}
              value={draftSettings?.params.top_p ?? undefined}
              onChange={(newValue) => {
                setDraftSettings(
                  produce((draft) => {
                    if (draft === null) return;

                    switch (typeof newValue) {
                      case "string":
                        draft.params.top_p = parseInt(newValue, 10);
                        break;

                      case "number":
                        draft.params.top_p = newValue;
                        break;

                      default:
                        break;
                    }
                  }),
                );
              }}
            />
            <NumberInput
              label="Min P"
              allowNegative={false}
              step={0.01}
              value={draftSettings?.params.min_p ?? undefined}
              onChange={(newValue) => {
                setDraftSettings(
                  produce((draft) => {
                    if (draft === null) return;

                    switch (typeof newValue) {
                      case "string":
                        draft.params.min_p = parseInt(newValue, 10);
                        break;

                      case "number":
                        draft.params.min_p = newValue;
                        break;

                      default:
                        break;
                    }
                  }),
                );
              }}
            />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
