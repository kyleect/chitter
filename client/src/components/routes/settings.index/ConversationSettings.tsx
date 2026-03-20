import { Alert, Card, Code, Stack, Textarea, Title } from "@mantine/core";
import { useSettingsContext } from "./SettingsContext";
import { produce } from "immer";

export const ConversationSettings = () => {
  const context = useSettingsContext()!;
  const [draftSettings, setDraftSettings] = context.state;

  return (
    <Card withBorder shadow="xs">
      <Stack>
        <Title order={3}>Conversation Settings</Title>

        <Textarea
          label={'"Add More Details" Prompt'}
          autosize
          minRows={1}
          value={draftSettings?.conversation_settings.add_detail_prompt ?? ""}
          onChange={(e) => {
            setDraftSettings(
              produce((draft) => {
                if (!draft) return;

                draft.conversation_settings.add_detail_prompt = e.target.value;
              }),
            );
          }}
        />

        <Alert>
          <Code>{"{{INPUT}}"}</Code> will be replaced with the input text to be
          rewritten.
        </Alert>

        <Textarea
          label={'"Rename Conversation" Prompt'}
          autosize
          minRows={1}
          value={
            draftSettings?.conversation_settings.rename_conversation_prompt ??
            ""
          }
          onChange={(e) => {
            setDraftSettings(
              produce((draft) => {
                if (!draft) return;

                draft.conversation_settings.rename_conversation_prompt =
                  e.target.value;
              }),
            );
          }}
        />

        <Alert>
          <Code>{"{{INPUT}}"}</Code> will be replaced with the input text to be
          rewritten.
        </Alert>
      </Stack>
    </Card>
  );
};
