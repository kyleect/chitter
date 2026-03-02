import { Stack, Group, ThemeIcon, CloseButton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";

type TemplateBlockProps = {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: React.ReactNode;
  isEditing: boolean;
  onDelete?: () => void;
};

export const ConversationBlock: React.FC<TemplateBlockProps> = ({
  icon,
  title,
  children,
  isEditing,
  onDelete: onClose,
}) => {
  return (
    <Stack gap="xs">
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
              onConfirm() {
                onClose?.call(null);
              },
            });
          }}
        />
      </Group>

      {children}
    </Stack>
  );
};
