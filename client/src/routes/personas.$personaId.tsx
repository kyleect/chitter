import { useGetPersonaByIdQuery } from "@/queries/personas";
import { Alert, Card, Group, Loader, Stack, Text } from "@mantine/core";
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
    <Stack>
      <Card>
        <Group>
          <Text mb={0} fw="bold">
            Persona:
          </Text>
          <Text>{getPersonaQuery.data?.name}</Text>
        </Group>
      </Card>

      {getPersonaQuery.data?.description && (
        <Card>
          <Stack>
            <Text mb={0} fw="bold">
              Description
            </Text>

            <Text>{getPersonaQuery.data?.description}</Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
