import {
  useGetPersonaByIdQuery,
  useUpdatePersonaMutation,
} from "@/queries/personas";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/personas/$personaId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const getPersonaQuery = useGetPersonaByIdQuery(params.personaId);
  const updatePersonaMutation = useUpdatePersonaMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    if (getPersonaQuery.data === null) return;

    setDraftName(getPersonaQuery.data?.name ?? "");
    setDraftDescription(getPersonaQuery.data?.description ?? "");
  }, [getPersonaQuery.data]);

  if (getPersonaQuery.isLoading) {
    return <Loader />;
  }

  if (getPersonaQuery.isError) {
    return <Alert color="red">{JSON.stringify(getPersonaQuery.error)}</Alert>;
  }

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updatePersonaMutation.mutate(
      {
        id: params.personaId,
        name: draftName,
        description: draftDescription,
      },
      {
        onSuccess() {
          setIsEditing(!isEditing);
        },
      },
    );
  };

  return (
    <Stack>
      <Button.Group>
        {isEditing ? (
          <Button onClick={handleSave}>Save</Button>
        ) : (
          <Button onClick={handleEdit}>Edit</Button>
        )}
      </Button.Group>
      <Card>
        <Group>
          <Text mb={0} fw="bold">
            Persona:
          </Text>
          {isEditing ? (
            <TextInput
              size="md"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          ) : (
            <Text>{draftName}</Text>
          )}
        </Group>
      </Card>

      <Card>
        <Stack>
          <Text mb={0} fw="bold">
            Description
          </Text>

          {isEditing ? (
            <Textarea
              size="md"
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              autosize
              minRows={1}
            />
          ) : (
            <Text>{draftDescription}</Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
