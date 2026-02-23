import {
  Badge,
  Card,
  Code,
  Drawer,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCodeDots,
  IconCpu,
  IconRobot,
  IconUser,
} from "@tabler/icons-react";
import { TemplateBlock } from "./TemplateBlock";
import { FC } from "react";
import { Conversation, ConversationItem } from "server-types";

type Props = {
  opened: boolean;
  close: () => void;
  templateByIdPreview?: Conversation;
  templateByIdItems: ConversationItem[];
  at?: number;
};

export const ConversationPreviewDrawer: FC<Props> = ({
  opened,
  close,
  templateByIdPreview,
  at,
}) => {
  return (
    <Drawer
      zIndex={10000}
      keepMounted={false}
      position="bottom"
      opened={opened}
      onClose={close}
      title={
        <Group>
          <Group>
            <Text fw="bold">Conversation Preview</Text>
            <Badge radius="xs" variant="outline" color="gray">
              Index: {at}
            </Badge>
          </Group>
        </Group>
      }
      size="lg"
    >
      <Stack mt="md">
        <Card withBorder shadow="xs">
          <Group>
            <ThemeIcon variant="transparent" color="gray">
              <IconCodeDots />
            </ThemeIcon>
            <Text mb={0} fw="bold">
              State
            </Text>
          </Group>
          <Code block>
            {JSON.stringify(templateByIdPreview?.variables ?? {}, null, 2)}
          </Code>
        </Card>
        {templateByIdPreview &&
          templateByIdPreview.messages.map((message, i) => {
            let icon: React.ReactNode = null;

            switch (message.role.kind) {
              case "user":
                icon = <IconUser stroke={1.5} />;
                break;
              case "assistant":
                icon = <IconRobot stroke={1.5} />;
                break;
              case "system":
                icon = <IconCpu stroke={1.5} />;
                break;
            }

            return (
              <TemplateBlock
                key={i}
                icon={icon}
                title={
                  <Text
                    fw="bold"
                    style={{
                      textTransform: "capitalize",
                    }}
                  >
                    {message.role.kind}
                  </Text>
                }
                isEditing={false}
              >
                <Text>{message.message}</Text>
              </TemplateBlock>
            );
          })}
      </Stack>
    </Drawer>
  );
};
