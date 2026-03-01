import { FC, SyntheticEvent, useEffect, useState } from "react";
import { ConversationBlock } from "./ConversationBlock";
import { Button, Stack, Text, Textarea } from "@mantine/core";
import { Message, Persona } from "server-types";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { produce } from "immer";

type Props = {
  messages: Message[];
  userPersona?: Persona;
  assistantPersona?: Persona;
  onEditMessage?: (index: number, message: Message) => void;
};

export const MessageList: FC<Props> = ({
  messages,
  assistantPersona,
  userPersona,
  onEditMessage,
}) => {
  const [isEditingMessageIndex, setIsEditingMessageIndex] = useState<
    number | null
  >(null);

  const [draftMessage, setDraftMessage] = useState<string>("");

  useEffect(() => {
    console.log({ draftMessage, isEditingMessageIndex });
  }, [draftMessage, isEditingMessageIndex]);

  const onSave = (index: number) => (e: SyntheticEvent) => {
    e.stopPropagation();

    const updatedMessage = produce((draft) => {
      draft.message = draftMessage;
    }, messages[index])();

    onEditMessage?.call(null, index, updatedMessage);

    setDraftMessage("");
    setIsEditingMessageIndex(null);
  };

  const onCancel = (e: SyntheticEvent) => {
    e.stopPropagation();
    setDraftMessage("");
    setIsEditingMessageIndex(null);
  };

  const isEditingAnyMessage = isEditingMessageIndex !== null;

  return messages.map((message, messageIndex) => {
    let icon: React.ReactNode = null;
    let from: string = message.role.kind;

    switch (message.role.kind) {
      case "user":
        icon = <UserIcon />;
        from = userPersona?.name ?? message.role.kind;
        break;
      case "assistant":
        icon = <AssistantIcon />;
        from = assistantPersona?.name ?? message.role.kind;
        break;
      case "system":
        return null;
    }

    const editingThisMessage = isEditingMessageIndex === messageIndex;

    return (
      <ConversationBlock
        icon={icon}
        title={
          <Text
            fw="bold"
            style={{
              textTransform: "capitalize",
            }}
          >
            {from}
          </Text>
        }
        isEditing={editingThisMessage}
      >
        <Stack
          mt="md"
          onClick={() => {
            if (isEditingAnyMessage) return;

            setIsEditingMessageIndex(messageIndex);
            setDraftMessage(message.message ?? "");
          }}
        >
          {editingThisMessage ? (
            <Stack>
              <Textarea
                size="md"
                autosize
                minRows={1}
                value={draftMessage ?? ""}
                onChange={(e) => setDraftMessage(e.target.value)}
              />

              <Button.Group>
                <Button size="compact-sm" onClick={onSave(messageIndex)}>
                  Save
                </Button>
                <Button size="compact-sm" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </Button.Group>
            </Stack>
          ) : (
            message.message
              ?.split("\n")
              .filter((v) => !!v)
              .map((text) => (
                <Text m={0} size="md">
                  {text}
                </Text>
              ))
          )}
        </Stack>
      </ConversationBlock>
    );
  });
};
