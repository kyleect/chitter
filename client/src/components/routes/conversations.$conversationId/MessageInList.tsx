import { FC } from "react";
import { ConversationBlock } from "./ConversationBlock";
import { Stack } from "@mantine/core";
import { EditingMessageForm } from "./EditingMessageForm";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { UserIcon } from "@/components/common/UserIcon";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { Message } from "server-types";
import { AuthorName } from "./AuthorName";
import { SystemIcon } from "@/components/common/SystemIcon";

type MessageInListProps = {
  value: Message;
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
  onChange,
  onCancelEdit,
  onDeleteMessage,
  isEditing,
  userName,
  assistantName,
  onClick,
}) => {
  let icon = getMesssageAuthorIcon(value);
  let author: string = getMessageAuthorName(value, userName, assistantName);

  return (
    <ConversationBlock
      icon={icon}
      title={<AuthorName name={author} />}
      isEditing={isEditing}
      onDelete={onDeleteMessage}
    >
      <Stack mt="md" onClick={onClick}>
        {isEditing ? (
          <EditingMessageForm
            value={value}
            onChange={onChange}
            onCancel={onCancelEdit}
          />
        ) : (
          <TextToParagraphs text={value.message ?? ""} />
        )}
      </Stack>
    </ConversationBlock>
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
      return <SystemIcon />;
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
