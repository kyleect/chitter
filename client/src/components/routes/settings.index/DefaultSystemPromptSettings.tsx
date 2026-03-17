import { Card, Stack, Textarea, Title } from "@mantine/core";
import { useSettingsContext } from "./SettingsContext";
import { produce } from "immer";

export const DefaultSystemPromptSettings = () => {
  const context = useSettingsContext()!;
  const [draftSettings, setDraftSettings] = context.state;

  return (
    <Card withBorder shadow="xs">
      <Stack>
        <Title order={3}>System Prompt</Title>

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
      </Stack>
    </Card>
  );
};
