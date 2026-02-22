import {
  useGetDefaultPersonasQuery,
  useGetPersonasQuery,
} from "@/queries/personas";
import {
  Alert,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconRobot, IconUser } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getPersonasQuery = useGetPersonasQuery();
  const getDefaultPersonasQuery = useGetDefaultPersonasQuery();
  const [draftUserPersonaId, setDraftUserPersonaId] = useState<string | null>(
    getDefaultPersonasQuery.data?.user ?? null,
  );
  const [draftAssistantPersonaId, setDraftAssistantPersonaId] = useState<
    string | null
  >(getDefaultPersonasQuery.data?.assistant ?? null);

  useEffect(() => {
    if (getDefaultPersonasQuery.data) {
      setDraftAssistantPersonaId(
        getDefaultPersonasQuery.data.assistant ?? null,
      );
      setDraftUserPersonaId(getDefaultPersonasQuery.data.user ?? null);
    }
  }, [getDefaultPersonasQuery.data]);

  if (getPersonasQuery.isLoading && getDefaultPersonasQuery.isLoading) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(getPersonasQuery.error)}
      </Alert>
    );
  }

  if (getDefaultPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load default personas:{" "}
        {JSON.stringify(getDefaultPersonasQuery.error)}
      </Alert>
    );
  }

  return (
    <Stack>
      <Title order={2}>Settings</Title>
      <Card withBorder shadow="xs">
        <Stack>
          <Title order={3}>Default Personas</Title>
          <Group gap="xl">
            <Group gap="xs">
              <ThemeIcon variant="subtle">
                <IconRobot stroke={1.5} color="white" />
              </ThemeIcon>
              {true ? (
                <Select
                  size="md"
                  data={getPersonasQuery.data?.map((persona) => ({
                    value: persona.id,
                    label: persona.name,
                  }))}
                  value={draftAssistantPersonaId}
                  onChange={(newId) => {
                    setDraftAssistantPersonaId(newId);
                  }}
                />
              ) : (
                <Text>
                  <Link
                    to="/personas/$personaId"
                    params={{
                      personaId: draftAssistantPersonaId ?? "",
                    }}
                  >
                    {
                      getPersonasQuery.data?.find(
                        (persona) => persona.id === draftAssistantPersonaId,
                      )?.name
                    }
                  </Link>
                </Text>
              )}
            </Group>

            <Group>
              <ThemeIcon variant="subtle">
                <IconUser stroke={1.5} color="white" />
              </ThemeIcon>
              {true ? (
                <Select
                  size="md"
                  data={getPersonasQuery.data?.map((persona) => ({
                    value: persona.id,
                    label: persona.name,
                  }))}
                  value={draftUserPersonaId}
                  onChange={(newId) => {
                    setDraftUserPersonaId(newId);
                  }}
                />
              ) : (
                <Text>
                  <Link
                    to="/personas/$personaId"
                    params={{
                      personaId: draftUserPersonaId ?? "",
                    }}
                  >
                    {
                      getPersonasQuery.data?.find(
                        (persona) => persona.id === draftUserPersonaId,
                      )?.name
                    }
                  </Link>
                </Text>
              )}
            </Group>
          </Group>

          {draftAssistantPersonaId === null ||
            (draftUserPersonaId === null && (
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

          <TextInput label="Host URL" required />
          <TextInput label="API Key" />
        </Stack>
      </Card>

      <Card withBorder shadow="xs">
        <Stack>
          <Title order={3}>LLM Parameters</Title>

          <Textarea autosize minRows={1} label="Default System Prompt" />

          <Group grow>
            <TextInput label="Temperature" />
            <TextInput label="Max Tokens" />
          </Group>
          <Group grow>
            <TextInput label="Top K" />
            <TextInput label="Top P" />
            <TextInput label="Min P" />
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
