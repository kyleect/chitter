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
  title: string;
  inline?: boolean;
  level?: number;
  isEditing: boolean;
  onClose?: () => void;
};

export const TemplateBlock: React.FC<TemplateBlockProps> = ({
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
    <Card withBorder shadow="xs" p="xs" ml={level * levelFactor}>
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
    </Card>
  );
};
