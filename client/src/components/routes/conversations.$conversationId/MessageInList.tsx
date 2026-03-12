import { FC, useContext } from "react";
import {
  ActionIcon,
  ActionIconGroup,
  Group,
  Stack,
  Text,
  ThemeIcon,
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
import { IconEdit, IconRefresh, IconX } from "@tabler/icons-react";
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
              <ActionIcon
                variant="subtle"
                color="gray"
                mb={0}
                onClick={onClick}
              >
                <IconEdit stroke={1} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
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
                    onConfirm: onDeleteMessage,
                  });
                }}
              >
                <IconX stroke={1} />
              </ActionIcon>
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
        ) : value.message?.length === 0 ? (
          <Text>[EMPTY]</Text>
        ) : (
          <TextToParagraphs text={value.message ?? "[EMPTY]"} />
        )}

        {isAssistantMessage && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            onClick={() => {
              regenerateResponseMutation.mutate(index);
            }}
          >
            <IconRefresh />
          </ActionIcon>
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
