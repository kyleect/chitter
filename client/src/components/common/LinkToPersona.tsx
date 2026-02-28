import { useGetPersonaByIdQuery } from "@/queries/personas";
import { Alert, Loader } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Persona } from "server-types";

type Props = {
  personaId: Persona["id"];
};

export const LinkToPersona: FC<Props> = ({ personaId }) => {
  const getPersonaQuery = useGetPersonaByIdQuery(personaId);

  if (getPersonaQuery.isPending) {
    return <Loader />;
  }

  if (getPersonaQuery.isError) {
    return <Alert color="red">Error fetching persona ({personaId})</Alert>;
  }

  return (
    <Link
      to="/personas/$personaId"
      params={{
        personaId,
      }}
    >
      {getPersonaQuery.data?.name}
    </Link>
  );
};
