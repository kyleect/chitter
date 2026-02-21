import { useGetPersonaByIdQuery } from "@/queries/personas";
import { Alert, Card, Group, Loader, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/personas/$personaId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const getPersonaQuery = useGetPersonaByIdQuery(params.personaId);

  if (getPersonaQuery.isLoading) {
    return <Loader />;
  }

  if (getPersonaQuery.isError) {
    return <Alert color="red">{JSON.stringify(getPersonaQuery.error)}</Alert>;
  }

  return (
    <Card>
      <Group>
        <Text mb={0} fw="bold">
          Persona:
        </Text>
        <Text>{getPersonaQuery.data?.name}</Text>
      </Group>
    </Card>
  );
}
