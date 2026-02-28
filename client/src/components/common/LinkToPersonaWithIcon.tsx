import { useGetPersonaByIdQuery } from "@/queries/personas";
import { Alert, Group, Loader, Text, ThemeIcon } from "@mantine/core";
import { FC, ReactNode } from "react";
import { Persona } from "server-types";
import { LinkToPersona } from "./LinkToPersona";

type Props = {
  personaId?: Persona["id"];
  onIcon: ReactNode;
  offIcon: ReactNode;
};

export const LinkToPersonaWithIcon: FC<Props> = ({
  personaId,
  onIcon,
  offIcon,
}) => {
  const getPersonaQuery = useGetPersonaByIdQuery(personaId ?? null);

  if (getPersonaQuery.isPending) {
    return <Loader />;
  }

  if (getPersonaQuery.isError) {
    return <Alert color="red">Error fetching persona ({personaId})</Alert>;
  }

  const persona = getPersonaQuery.data;

  return (
    <Group gap="xs">
      {persona ? (
        <>
          <ThemeIcon variant="subtle">{onIcon}</ThemeIcon>
          <Text>
            <LinkToPersona personaId={persona.id} />
          </Text>
        </>
      ) : (
        <>
          <ThemeIcon variant="subtle">{offIcon}</ThemeIcon>
        </>
      )}
    </Group>
  );
};
