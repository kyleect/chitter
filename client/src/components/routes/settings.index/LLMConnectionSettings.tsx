import { Card, Stack, TextInput, Title } from "@mantine/core";
import { produce } from "immer";
import { useSettingsContext } from "./SettingsContext";

export const LLMConnectionSettings = () => {
  const context = useSettingsContext()!;
  const [settings, setDraftSettings] = context.state;

  return (
    <Card withBorder shadow="xs">
      <Stack>
        <Title order={3}>LLM Connection</Title>

        <TextInput
          label="Host URL"
          required
          value={settings?.connection.url ?? ""}
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
  );
};
