import { FC, useContext } from "react";
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
  const conversationContext = useContext(ConversationContext)!;

  const [editingMessageIndex, setEditingMessageIndex] =
    conversationContext?.editingMessageIndexState;

  const [systemMessagesAreVisible] =
    conversationContext?.systemMessagesAreVisibleState;

  return messages
    .filter((message) => {
      let isSystemMessage = message.role.kind === "system";

      return systemMessagesAreVisible ? true : !isSystemMessage;
    })
    .map((message, messageIndex) => (
      <MessageInList
        value={message}
        index={messageIndex}
        onChange={(updatedMessage) => {
          onMessageChange?.(messageIndex, updatedMessage);
          setEditingMessageIndex(null);
        }}
        userName={userPersona?.name ?? message.role.kind}
        assistantName={assistantPersona?.name ?? message.role.kind}
        onClick={() => {
          setEditingMessageIndex(messageIndex);
        }}
        isEditing={messageIndex === editingMessageIndex}
        onCancelEdit={() => {
          setEditingMessageIndex(null);
        }}
        onDeleteMessage={() => {
          onMessageDelete?.(messageIndex);
          setEditingMessageIndex(null);
        }}
      />
    ));
};
