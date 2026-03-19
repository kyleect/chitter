import { FC, useContext, useState } from "react";
import {
  ActionIcon,
  ActionIconGroup,
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
  Transition,
} from "@mantine/core";
import { EditingMessageForm } from "./EditingMessageForm";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { UserIcon } from "@/components/common/UserIcon";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { Message } from "server-types";
import { SystemIcon } from "@/components/common/SystemIcon";
import { useHover } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconEdit,
  IconPencilPlus,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useRegenerateResponseMutation } from "@/queries/completions";
import { ConversationContext } from "./ConversationContext";

type MessageInListProps = {
  value: Message;
  index: number;
  onChange: (updatedMessage: Message) => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  onDeleteMessage: () => void;
  userName: string;
  assistantName: string;
  onClick: () => void;
};

export const MessageInList: FC<MessageInListProps> = ({
  value,
  index,
  onChange,
  onCancelEdit,
  onDeleteMessage,
  isEditing,
  userName,
  assistantName,
  onClick,
}) => {
  const { hovered, ref } = useHover();
  let icon = getMesssageAuthorIcon(value);
  let author: string = getMessageAuthorName(value, userName, assistantName);
  const context = useContext(ConversationContext)!;
  const [isEditingRegenerationPrompt, setIsEditingRegenerationPrompt] =
    useState(false);
  const [regenerationPrompt, setRegenerationPrompt] = useState("");

  const regenerateResponseMutation = useRegenerateResponseMutation(
    context.conversation.id,
  );

  const isAssistantMessage = value.role.kind === "assistant";

  return (
    <Stack
      gap="xs"
      ref={ref}
      bg={hovered ? "gray" : undefined}
      style={{
        border: value.role.kind === "system" ? `1px solid violet` : undefined,
      }}
      p="sm"
    >
      <Group justify="space-between">
        <Group gap="xs">
          <ThemeIcon variant="subtle">{icon}</ThemeIcon>
          <Text mb={0} fw="bold">
            {author}
          </Text>
        </Group>

        <Transition
          mounted={hovered && !isEditing}
          transition="pop-top-right"
          enterDelay={0}
          exitDelay={125}
          duration={100}
        >
          {(styles) => (
            <ActionIconGroup style={styles}>
              <EditMessageButton onClick={onClick} />

              <DeleteMessageButton onClick={onDeleteMessage} />
            </ActionIconGroup>
          )}
        </Transition>
      </Group>

      <Stack mt="md">
        {isEditing ? (
          <EditingMessageForm
            value={value}
            onChange={onChange}
            onCancel={onCancelEdit}
          />
        ) : value.content?.length === 0 ? (
          <Text>[EMPTY]</Text>
        ) : (
          <TextToParagraphs text={value.content} />
        )}

        <ActionIcon.Group>
          {isAssistantMessage && (
            <>
              <Tooltip.Floating label="Regenerate message">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  disabled={context.isGenerating || isEditingRegenerationPrompt}
                  onClick={() => {
                    regenerateResponseMutation.mutate({ messageIndex: index });
                  }}
                >
                  <IconRefresh />
                </ActionIcon>
              </Tooltip.Floating>
              <Tooltip.Floating label="Regenerate message using guidance prompt">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  disabled={context.isGenerating || isEditingRegenerationPrompt}
                  onClick={() => {
                    setIsEditingRegenerationPrompt(true);
                  }}
                >
                  <IconPencilPlus />
                </ActionIcon>
              </Tooltip.Floating>
            </>
          )}
        </ActionIcon.Group>

        {isEditingRegenerationPrompt && (
          <Stack>
            <Textarea
              autosize
              minRows={1}
              label="Guidance Prompt"
              autoFocus
              value={regenerationPrompt}
              onChange={(e) => {
                setRegenerationPrompt(e.target.value);
              }}
            />

            <Group justify="space-between">
              <Button.Group>
                <Button
                  size="compact-sm"
                  variant="subtle"
                  disabled={regenerationPrompt.length === 0}
                  onClick={() => {
                    regenerateResponseMutation.mutate({
                      messageIndex: index,
                      guidancePrompt: regenerationPrompt,
                    });
                  }}
                >
                  Regenerate
                </Button>
              </Button.Group>

              <Button.Group>
                <Button
                  size="compact-sm"
                  variant="subtle"
                  color="red"
                  onClick={() => {
                    setIsEditingRegenerationPrompt(false);
                  }}
                >
                  Cancel
                </Button>
              </Button.Group>
            </Group>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

function getMesssageAuthorIcon(message: Message): React.ReactNode | null {
  let icon: React.ReactNode = null;

  switch (message.role.kind) {
    case "user":
      icon = <UserIcon />;
      break;
    case "assistant":
      icon = <AssistantIcon />;
      break;
    case "system":
      return <SystemIcon color="violet" />;
  }

  return icon;
}

function getMessageAuthorName(
  message: Message,
  userName: string,
  assistantName: string,
): string {
  let from: string = message.role.kind;

  switch (message.role.kind) {
    case "user":
      from = userName;
      break;
    case "assistant":
      from = assistantName;
      break;
    case "system":
      return "System";
  }

  return from;
}

type EditMessageButtonProps = {
  onClick: () => void;
};

const EditMessageButton: FC<EditMessageButtonProps> = ({ onClick }) => {
  const context = useContext(ConversationContext)!;

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      disabled={context.isGenerating}
      mb={0}
      onClick={onClick}
    >
      <IconEdit stroke={1} />
    </ActionIcon>
  );
};

type DeleteMessageButtonProps = {
  onClick: () => void;
};

const DeleteMessageButton: FC<DeleteMessageButtonProps> = ({ onClick }) => {
  const context = useContext(ConversationContext)!;

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      disabled={context.isGenerating}
      mb={0}
      onClick={() => {
        modals.openConfirmModal({
          title: "Delete message from conversation?",
          labels: {
            confirm: "Delete Message",
            cancel: "Cancel",
          },
          confirmProps: {
            color: "red",
          },
          onConfirm: onClick,
        });
      }}
    >
      <IconX stroke={1} />
    </ActionIcon>
  );
};
