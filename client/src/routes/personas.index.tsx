import {
  useCreatePersonaMutation,
  useDeletePersonaMutation,
  useGetPersonasQuery,
} from "@/queries/personas";
import {
  Alert,
  Button,
  Card,
  CloseButton,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/personas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [draftName, setDraftName] = useState("");
  const personasQuery = useGetPersonasQuery();
  const createPersonaMutation = useCreatePersonaMutation();
  const deletePersonaMutation = useDeletePersonaMutation();

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
            <Group justify="space-between">
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
              <CloseButton
                onClick={() => {
                  modals.openConfirmModal({
                    title: "Delete Persona",
                    labels: {
                      confirm: "Delete",
                      cancel: "Cancel",
                    },
                    confirmProps: {
                      color: "red",
                    },
                    onConfirm() {
                      deletePersonaMutation.mutate(persona.id);
                    },
                  });
                }}
              />
            </Group>
          </Card>
        );
      })}

      <Card>
        <Group>
          <TextInput
            flex={1}
            value={draftName}
            size="md"
            placeholder="Persona Name"
            onChange={(e) => setDraftName(e.target.value)}
          />

          <Button.Group>
            <Button onClick={handleAddPersona}>Add</Button>
          </Button.Group>
        </Group>
      </Card>
    </Stack>
  );
}
