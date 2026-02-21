import { useGetPersonasQuery } from "@/queries/personas";
import { Alert, Code, Loader } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/personas")({
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
  return <Code block>{JSON.stringify(personasQuery.data, null, 2)}</Code>;
}
