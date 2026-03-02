import { Stack, Group, ThemeIcon, CloseButton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { Ref } from "react";

type TemplateBlockProps = {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: React.ReactNode;
  isEditing: boolean;
  onDelete?: () => void;
  ref: Ref<HTMLDivElement>;
};

export const ConversationBlock: React.FC<TemplateBlockProps> = ({
  icon,
  title,
  children,
  isEditing,
  onDelete,
  ref,
}) => {
  return (
    <Stack gap="xs" ref={ref}>
      <Group justify="space-between">
        <Group gap="xs">
          <ThemeIcon variant="subtle">{icon}</ThemeIcon>
          <Text mb={0} fw="bold">
            {title}
          </Text>
        </Group>

        <CloseButton
          style={{
            visibility: isEditing ? undefined : "hidden",
          }}
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
              onConfirm: onDelete,
            });
          }}
        />
      </Group>

      {children}
    </Stack>
  );
};
