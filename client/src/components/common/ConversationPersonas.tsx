import { Group, Text, ThemeIcon } from "@mantine/core";
import {
  IconRobot,
  IconRobotOff,
  IconUser,
  IconUserOff,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Persona } from "server-types";

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
      <Group gap="xs">
        <ThemeIcon variant="subtle">
          {assistantPersona ? (
            <IconRobot stroke={1.5} color="white" />
          ) : (
            <IconRobotOff stroke={1.5} color="white" />
          )}
        </ThemeIcon>
        <Text>
          <Link
            to="/personas/$personaId"
            params={{
              personaId: assistantPersona?.id ?? "",
            }}
          >
            {assistantPersona?.name}
          </Link>
        </Text>
      </Group>

      <Group gap="xs">
        <ThemeIcon variant="subtle">
          {userPersona ? (
            <IconUser stroke={1.5} color="white" />
          ) : (
            <IconUserOff stroke={1.5} color="white" />
          )}
        </ThemeIcon>
        <Text>
          <Link
            to="/personas/$personaId"
            params={{
              personaId: userPersona?.id ?? "",
            }}
          >
            {userPersona?.name}
          </Link>
        </Text>
      </Group>
    </Group>
  );
};
