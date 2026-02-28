import { AssistantIcon } from "@/components/common/AssistantIcon";
import { ConversationPersonas } from "@/components/common/ConversationPersonas";
import { UserIcon } from "@/components/common/UserIcon";
import {
  useCreatePersonaMutation,
  useDeletePersonaMutation,
  useGetPersonaByIdQuery,
  useGetPersonasQuery,
} from "@/queries/personas";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/queries/settings";
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { produce } from "immer";
import { useState } from "react";

export const Route = createFileRoute("/personas/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [draftName, setDraftName] = useState("");
  const personasQuery = useGetPersonasQuery();
  const createPersonaMutation = useCreatePersonaMutation();
  const deletePersonaMutation = useDeletePersonaMutation();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const getSettingsQuery = useGetSettingsQuery();
  const getAssistantQuery = useGetPersonaByIdQuery(
    getSettingsQuery.data?.default_assistant_persona_id ?? null,
  );
  const getUserQuery = useGetPersonaByIdQuery(
    getSettingsQuery.data?.default_user_persona_id ?? null,
  );

  if (personasQuery.isPending && getSettingsQuery.isPending) {
    return <Loader />;
  }

  if (personasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(personasQuery.error)}
      </Alert>
    );
  }

  if (getSettingsQuery.isError) {
    return (
      <Alert color="red">
        Failed to load settings: {JSON.stringify(getSettingsQuery.error)}
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
          <Card key={persona.id}>
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
                <Text
                  mb={0}
                  size="sm"
                  fw={
                    getSettingsQuery.data?.default_assistant_persona_id ===
                      persona.id ||
                    getSettingsQuery.data?.default_user_persona_id ===
                      persona.id
                      ? "bold"
                      : undefined
                  }
                >
                  Default
                </Text>
                <ActionIcon.Group>
                  <ActionIcon
                    variant={
                      getSettingsQuery.data?.default_assistant_persona_id ===
                      persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      updateSettingsMutation.mutate(
                        produce((draft) => {
                          draft.default_assistant_persona_id = persona.id;
                        })(getSettingsQuery.data),
                      );
                    }}
                  >
                    <AssistantIcon />
                  </ActionIcon>
                  <ActionIcon
                    variant={
                      getSettingsQuery.data?.default_user_persona_id ===
                      persona.id
                        ? "filled"
                        : "outline"
                    }
                    size="md"
                    onClick={() => {
                      updateSettingsMutation.mutate(
                        produce((draft) => {
                          draft.default_user_persona_id = persona.id;
                        })(getSettingsQuery.data),
                      );
                    }}
                  >
                    <UserIcon />
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
