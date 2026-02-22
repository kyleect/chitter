import { ConversationBlock } from "@/components/routes/conversations.$conversationId/ConversationBlock";
import { useGetConservationByIdQuery } from "@/queries/conversations";
import { useGetPersonaByIdQuery } from "@/queries/personas";
import { useGetTemplateByIdQuery } from "@/queries/templates";
import {
  Alert,
  Button,
  ButtonGroup,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { IconRobot, IconSend, IconUser } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const [reply, setReply] = useState("");
  const params = Route.useParams();
  const getConversationQuery = useGetConservationByIdQuery(
    params.conversationId,
  );

  const getTemplateByIdQuery = useGetTemplateByIdQuery(
    getConversationQuery.data?.templateId,
  );

  const getAssistantPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.assistantPersonaId,
  );

  const getUserPersonaQuery = useGetPersonaByIdQuery(
    getConversationQuery.data?.userPersonaId,
  );

  if (
    getConversationQuery.isLoading &&
    getTemplateByIdQuery.isLoading &&
    getAssistantPersonaQuery.isLoading &&
    getUserPersonaQuery.isLoading
  ) {
    return <Loader />;
  }

  if (getConversationQuery.isError) {
    return <Alert color="red">Failed to fetch conversation</Alert>;
  }

  if (getTemplateByIdQuery.isError) {
    return <Alert color="red">Failed to fetch template</Alert>;
  }

  if (getAssistantPersonaQuery.isError) {
    return <Alert color="red">Failed to assistant persona</Alert>;
  }

  if (getUserPersonaQuery.isError) {
    return <Alert color="red">Failed to user persona</Alert>;
  }

  return (
    <Stack mt="md" gap="xl">
      {getConversationQuery.data &&
        getConversationQuery.data.messages.map((message) => {
          let icon: React.ReactNode = null;
          let from: string = message.role.kind;

          switch (message.role.kind) {
            case "user":
              icon = <IconUser stroke={1.5} />;
              from = getUserPersonaQuery.data?.name ?? message.role.kind;
              break;
            case "assistant":
              icon = <IconRobot stroke={1.5} />;
              from = getAssistantPersonaQuery.data?.name ?? message.role.kind;
              break;
            case "system":
              return null;
          }

          return (
            <ConversationBlock
              icon={icon}
              title={
                <Text
                  fw="bold"
                  style={{
                    textTransform: "capitalize",
                  }}
                >
                  {from}
                </Text>
              }
              isEditing={false}
            >
              <Stack mt="md">
                {message.message
                  ?.split("\n")
                  .filter((v) => !!v)
                  .map((text) => (
                    <Text m={0} size="md">
                      {text}
                    </Text>
                  ))}
              </Stack>
            </ConversationBlock>
          );
        })}
      <Group align="flex-end" mt="md">
        <Textarea
          size="md"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
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
    </Stack>
  );
}
