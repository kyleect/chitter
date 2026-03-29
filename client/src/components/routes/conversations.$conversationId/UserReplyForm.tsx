import { Button, ButtonGroup, Group, Textarea, ThemeIcon } from "@mantine/core";
import { IconBubbleText, IconSend } from "@tabler/icons-react";
import { FC, Ref, useContext } from "react";
import { ConversationContext } from "./ConversationContext";
import { useChatImpersonationCompletionMutation } from "@/queries/completions";

type Props = {
  isLoading: boolean;
  value: string;
  onChange: (newValue: string) => void;
  onSubmit: (value: string) => void;
  ref: Ref<HTMLTextAreaElement>;
};

export const UserReplyForm: FC<Props> = ({
  isLoading,
  value,
  onChange,
  onSubmit,
  ref,
}) => {
  const conversationContext = useContext(ConversationContext)!;
  const [editingMessageIndex] = conversationContext?.editingMessageIndexState;
  const chatImpersonationCompletionMutation =
    useChatImpersonationCompletionMutation(conversationContext.conversation.id);

  const isEditingMessage = !!editingMessageIndex;

  return (
    <Group align="flex-end" mt="md">
      <Textarea
        size="md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autosize
        minRows={0}
        autoFocus
        flex={1}
        disabled={isLoading || isEditingMessage}
        ref={ref}
      />
      <ButtonGroup>
        <Button
          size="md"
          variant="gradient"
          loading={isLoading}
          disabled={isEditingMessage || value.length === 0}
          leftSection={
            <ThemeIcon size="xs">
              <IconSend />
            </ThemeIcon>
          }
          onClick={() => {
            onSubmit?.(value);
          }}
        >
          Reply
        </Button>
        <Button
          size="md"
          variant="subtle"
          loading={isLoading}
          disabled={isEditingMessage || value.length > 0}
          leftSection={
            <ThemeIcon size="xs" variant="subtle">
              <IconBubbleText stroke={1.5} />
            </ThemeIcon>
          }
          onClick={() => {
            chatImpersonationCompletionMutation.mutate();
          }}
        >
          Impersonate
        </Button>
      </ButtonGroup>
    </Group>
  );
};
