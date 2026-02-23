import { Button, ButtonGroup, Group, Textarea, ThemeIcon } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  value: string;
  onChange: (newValue: string) => void;
};

export const UserReplyForm: FC<Props> = ({ value, onChange }) => (
  <Group align="flex-end" mt="md">
    <Textarea
      size="md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autosize
      minRows={0}
      autoFocus
      flex={1}
    />
    <ButtonGroup>
      <Button
        size="md"
        variant="gradient"
        leftSection={
          <ThemeIcon size="xs">
            <IconSend />
          </ThemeIcon>
        }
      >
        Reply
      </Button>
    </ButtonGroup>
  </Group>
);
