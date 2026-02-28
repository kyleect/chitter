import { Group } from "@mantine/core";
import { FC } from "react";
import { Persona } from "server-types";
import { LinkToPersonaWithIcon } from "./LinkToPersonaWithIcon";
import { AssistantIcon, AssistantMissingIcon } from "./AssistantIcon";
import { UserIcon, UserMissingIcon } from "./UserIcon";

type Props = {
  assistantPersona?: Persona;
  userPersona?: Persona;
};

export const ConversationPersonas: FC<Props> = ({
  assistantPersona,
  userPersona,
}) => {
  return (
    <Group gap="xl">
      <LinkToPersonaWithIcon
        personaId={assistantPersona?.id}
        onIcon={<AssistantIcon color="white" />}
        offIcon={<AssistantMissingIcon color="white" />}
      />

      <LinkToPersonaWithIcon
        personaId={userPersona?.id}
        onIcon={<UserIcon color="white" />}
        offIcon={<UserMissingIcon color="white" />}
      />
    </Group>
  );
};
