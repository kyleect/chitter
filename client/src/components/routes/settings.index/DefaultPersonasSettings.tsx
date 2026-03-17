import {
  Alert,
  Card,
  Group,
  Loader,
  Select,
  Stack,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { produce } from "immer";
import { useSettingsContext } from "./SettingsContext";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { useGetPersonasQuery } from "@/queries/personas";

export const DefaultPersonasSettings = () => {
  const context = useSettingsContext()!;
  const [draftSettings, setDraftSettings] = context.state;

  const getPersonasQuery = useGetPersonasQuery();

  if (getPersonasQuery.isPending) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(getPersonasQuery.error)}
      </Alert>
    );
  }

  return (
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
  );
};
