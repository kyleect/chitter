import { Button, Stack, Textarea } from "@mantine/core";
import { produce } from "immer";
import { FC, useState } from "react";
import { Message } from "server-types";

type Props = {
  value: Message;
  onChange: (updatedMessage: Message) => void;
  onCancel: () => void;
};

export const EditingMessageForm: FC<Props> = ({
  value,
  onChange,
  onCancel,
}) => {
  const [draftMessage, setDraftMessage] = useState<string>(value.message ?? "");

  return (
    <Stack>
      <Textarea
        size="md"
        autosize
        minRows={1}
        value={draftMessage ?? ""}
        onChange={(e) => setDraftMessage(e.target.value)}
      />

      <Button.Group>
        <Button
          size="compact-sm"
          onClick={(e) => {
            e.stopPropagation();
            const updatedMessage = produce(value, (draft) => {
              draft.message = draftMessage;
            });

            debugger;

            onChange?.(updatedMessage);
          }}
        >
          Save
        </Button>
        <Button
          size="compact-sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onCancel?.();
          }}
        >
          Cancel
        </Button>
      </Button.Group>
    </Stack>
  );
};
