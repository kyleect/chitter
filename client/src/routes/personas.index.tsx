import { useGetPersonasQuery } from "@/queries/personas";
import { Alert, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/personas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const personasQuery = useGetPersonasQuery();

  if (personasQuery.isLoading) {
    return <Loader />;
  }

  if (personasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(personasQuery.error)}
      </Alert>
    );
  }
  return (
    <Stack>
      {personasQuery.data?.map((persona) => {
        return (
          <Card>
            <Group>
              <Text mb={0} fw="bold">
                Persona:
              </Text>
              <Text>
                <Link
                  to="/personas/$personaId"
                  params={{
                    personaId: persona.id,
                  }}
                >
                  {persona.name}
                </Link>
              </Text>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
