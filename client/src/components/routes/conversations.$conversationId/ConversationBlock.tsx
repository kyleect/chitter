import {
  Card,
  Stack,
  Group,
  ThemeIcon,
  CloseButton,
  Text,
} from "@mantine/core";

type TemplateBlockProps = {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: React.ReactNode;
  inline?: boolean;
  level?: number;
  isEditing: boolean;
  onClose?: () => void;
};

export const ConversationBlock: React.FC<TemplateBlockProps> = ({
  icon,
  title,
  inline,
  children,
  level = 0,
  isEditing,
  onClose,
}) => {
  const levelFactor = 50;

  return inline && !isEditing ? (
    <Card withBorder shadow="xs" p="xs" ml={level * levelFactor}>
      <Stack>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="subtle">{icon}</ThemeIcon>
            <Text mb={0} fw="bold">
              {title}
            </Text>
          </Group>

          <Group>
            {children}
            <CloseButton
              style={{
                visibility: isEditing ? undefined : "hidden",
              }}
              onClick={() => onClose?.call(null)}
            />
          </Group>
        </Group>
      </Stack>
    </Card>
  ) : (
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
          onClick={() => onClose?.call(null)}
        />
      </Group>

      {children}
    </Stack>
  );
};
