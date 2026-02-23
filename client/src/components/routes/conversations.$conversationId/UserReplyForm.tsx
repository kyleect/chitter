import { Button, ButtonGroup, Group, Textarea, ThemeIcon } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  isLoading: boolean;
  value: string;
  onChange: (newValue: string) => void;
  onSubmit: (value: string) => void;
};

export const UserReplyForm: FC<Props> = ({
  isLoading,
  value,
  onChange,
  onSubmit,
}) => (
  <Group align="flex-end" mt="md">
    <Textarea
      size="md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autosize
      minRows={0}
      autoFocus
      flex={1}
      disabled={isLoading}
    />
    <ButtonGroup>
      <Button
        size="md"
        variant="gradient"
        loading={isLoading}
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
    </ButtonGroup>
  </Group>
);
