import { Card, Group, NumberInput, Stack, Title } from "@mantine/core";
import { produce } from "immer";
import { useSettingsContext } from "./SettingsContext";

export const LLMParameterSettings = () => {
  const context = useSettingsContext()!;
  const [draftSettings, setDraftSettings] = context.state;

  return (
    <Card withBorder shadow="xs">
      <Stack>
        <Title order={3}>LLM Parameters</Title>

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
  );
};
