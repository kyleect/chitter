import {
  Button,
  Card,
  Checkbox,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { produce } from "immer";
import { FC, useState } from "react";
import { TemplatePrompt } from "server-types";

type Props = {
  prompts: TemplatePrompt[];
  onSubmit: (values: Record<string, string>) => void;
};

export const StartChatModal: FC<Props> = ({ prompts, onSubmit }) => {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <Stack>
      <Text>Prompts</Text>

      {prompts.map(({ prompt, valueType, key }) => {
        const componentKey = `${key}-${valueType}`;
        let input = <></>;

        if (valueType === "string") {
          input = (
            <Textarea
              minRows={1}
              autosize
              label={prompt}
              key={componentKey}
              value={values[key]}
              onChange={(e) => {
                setValues(
                  produce((draft) => {
                    draft[key] = e.target.value;
                  }),
                );
              }}
            />
          );
        }

        if (valueType === "number") {
          input = (
            <NumberInput
              label={prompt}
              key={componentKey}
              value={values[key]}
              onChange={(e) => {
                setValues(
                  produce((draft) => {
                    draft[key] = Number.isNaN(e) ? (e as string) : e.toString();
                  }),
                );
              }}
            />
          );
        }

        if (valueType === "boolean") {
          input = (
            <Checkbox
              label={prompt}
              key={componentKey}
              checked={values[key] === "true"}
              onChange={(e) => {
                setValues(
                  produce((draft) => {
                    draft[key] = e.target.checked ? "true" : "false";
                  }),
                );
              }}
            />
          );
        }

        return (
          <Card>
            <Stack>{input}</Stack>
          </Card>
        );
      })}

      <Button.Group>
        <Button
          variant="gradient"
          onClick={() => {
            onSubmit(values);
          }}
        >
          Start Chat
        </Button>
      </Button.Group>
    </Stack>
  );
};
