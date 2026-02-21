import {
  useCreatePersonaMutation,
  useGetPersonasQuery,
} from "@/queries/personas";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/personas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [draftName, setDraftName] = useState("");
  const personasQuery = useGetPersonasQuery();
  const createPersonaMutation = useCreatePersonaMutation();

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

  const handleAddPersona = () => {
    createPersonaMutation.mutate(
      {
        name: draftName,
        description: null,
      },
      {
        onSuccess() {
          setDraftName("");
        },
      },
    );
  };

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

      <Card>
        <Stack>
          <TextInput
            value={draftName}
            size="md"
            placeholder="Persona Name"
            onChange={(e) => setDraftName(e.target.value)}
          />

          <Button.Group>
            <Button onClick={handleAddPersona}>Add</Button>
          </Button.Group>
        </Stack>
      </Card>
    </Stack>
  );
}
