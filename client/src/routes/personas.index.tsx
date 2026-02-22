import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import {
  useCreatePersonaMutation,
  useDeletePersonaMutation,
  useGetDefaultPersonasQuery,
  useGetPersonaByIdQuery,
  useGetPersonasQuery,
  useSetDefaultAssistantPersonaMutation,
  useSetDefaultUserPersonaMutation,
} from "@/queries/personas";
import {
  ActionIcon,
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
import { IconRobot, IconUser } from "@tabler/icons-react";
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
  const setDefaultAssistantPersonaMutation =
    useSetDefaultAssistantPersonaMutation();
  const setDefaultUserPersonaMutation = useSetDefaultUserPersonaMutation();
  const getDefaultPersonasQuery = useGetDefaultPersonasQuery();
  const getAssistantQuery = useGetPersonaByIdQuery(
    getDefaultPersonasQuery.data?.assistant,
  );
  const getUserQuery = useGetPersonaByIdQuery(
    getDefaultPersonasQuery.data?.user,
  );

  if (personasQuery.isLoading && getDefaultPersonasQuery.isLoading) {
    return <Loader />;
  }

  if (personasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(personasQuery.error)}
      </Alert>
    );
  }

  if (getDefaultPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load default personas:{" "}
        {JSON.stringify(getDefaultPersonasQuery.error)}
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
      <Group gap="xl">
        <Text fw="bold" mb={0}>
          Defaults
        </Text>
        <ConversationPersonas
          assistantPersona={getAssistantQuery.data}
          userPersona={getUserQuery.data}
        />
      </Group>
      {personasQuery.data?.map((persona) => {
        return (
          <Card>
            <Group justify="space-between">
              <Group>
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
              <Group>
                <Text mb={0} size="sm">
                  Default
                </Text>
                <ActionIcon.Group>
                  <ActionIcon
                    variant={
                      getDefaultPersonasQuery.data?.assistant === persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      setDefaultAssistantPersonaMutation.mutate(persona.id);
                    }}
                  >
                    <IconRobot stroke={1} />
                  </ActionIcon>
                  <ActionIcon
                    variant={
                      getDefaultPersonasQuery.data?.user === persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      setDefaultUserPersonaMutation.mutate(persona.id);
                    }}
                  >
                    <IconUser stroke={1} />
                  </ActionIcon>
                </ActionIcon.Group>
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
            autoFocus
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
