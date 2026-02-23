import { IconRobot, IconUser } from "@tabler/icons-react";
import { FC } from "react";
import { ConversationBlock } from "./ConversationBlock";
import { Stack, Text } from "@mantine/core";
import { Message, Persona } from "server-types";

type Props = {
  messages: Message[];
  userPersona?: Persona;
  assistantPersona?: Persona;
};

export const MessageList: FC<Props> = ({
  messages,
  assistantPersona,
  userPersona,
}) => {
  return messages.map((message) => {
    let icon: React.ReactNode = null;
    let from: string = message.role.kind;

    switch (message.role.kind) {
      case "user":
        icon = <IconUser stroke={1.5} />;
        from = userPersona?.name ?? message.role.kind;
        break;
      case "assistant":
        icon = <IconRobot stroke={1.5} />;
        from = assistantPersona?.name ?? message.role.kind;
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
  });
};
