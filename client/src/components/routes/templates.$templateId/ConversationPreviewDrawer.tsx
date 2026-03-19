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
import { IconCodeDots } from "@tabler/icons-react";
import { TemplateBlock } from "./TemplateBlock";
import { FC, useContext } from "react";
import { Conversation } from "server-types";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { SystemIcon } from "@/components/common/SystemIcon";
import { TemplateContext } from "./TemplateContext";

type Props = {
  templateByIdPreview?: Conversation;
};

export const ConversationPreviewDrawer: FC<Props> = ({
  templateByIdPreview,
}) => {
  const context = useContext(TemplateContext)!;

  const { previewConversationAtIndexState, previewConversationModal } = context;

  const [previewConversationAtIndex] = previewConversationAtIndexState;

  return (
    <Drawer
      zIndex={10000}
      keepMounted={false}
      position="bottom"
      opened={previewConversationModal.opened}
      onClose={previewConversationModal.close}
      title={
        <Group>
          <Group>
            <Text fw="bold">Conversation Preview</Text>
            <Badge radius="xs" variant="outline" color="gray">
              Index: {previewConversationAtIndex}
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
                icon = <UserIcon />;
                break;
              case "assistant":
                icon = <AssistantIcon />;
                break;
              case "system":
                icon = <SystemIcon />;
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
              >
                <Text>{message.content}</Text>
              </TemplateBlock>
            );
          })}
      </Stack>
    </Drawer>
  );
};
