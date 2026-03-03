import { FC, useContext, useState } from "react";
import { Message, Persona } from "server-types";
import { MessageInList } from "./MessageInList";
import { ConversationContext } from "./ConversationContext";

type Props = {
  messages: Message[];
  userPersona?: Persona;
  assistantPersona?: Persona;
  onMessageChange?: (index: number, message: Message) => void;
  onMessageDelete?: (index: number) => void;
};

export const MessageList: FC<Props> = ({
  messages,
  assistantPersona,
  userPersona,
  onMessageChange,
  onMessageDelete,
}) => {
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null,
  );
  const conversationContext = useContext(ConversationContext);

  return messages.map((message, messageIndex) => (
    <MessageInList
      value={message}
      onChange={(updatedMessage) => {
        onMessageChange?.(messageIndex, updatedMessage);
        setEditingMessageIndex(null);
      }}
      userName={userPersona?.name ?? message.role.kind}
      assistantName={assistantPersona?.name ?? message.role.kind}
      onClick={() => {
        setEditingMessageIndex(messageIndex);
        conversationContext?.setIsEditingMessage(true);
      }}
      isEditing={messageIndex === editingMessageIndex}
      onCancelEdit={() => {
        setEditingMessageIndex(null);
        conversationContext?.setIsEditingMessage(false);
      }}
      onDeleteMessage={() => {
        onMessageDelete?.(messageIndex);
        setEditingMessageIndex(null);
      }}
    />
  ));
};
