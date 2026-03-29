import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import {
  useGetPersonaByIdQuery,
  useUpdatePersonaMutation,
} from "@/queries/personas";
import {
  ActionIcon,
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
import { IconTrash } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
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
  const [draftFirstMessages, setDraftFirstMessages] = useState<string[]>([]);

  useEffect(() => {
    if (getPersonaQuery.data === null) return;

    setDraftName(getPersonaQuery.data?.name ?? "");
    setDraftDescription(getPersonaQuery.data?.description ?? "");
    setDraftFirstMessages(getPersonaQuery.data?.firstMessages ?? []);
  }, [getPersonaQuery.data]);

  if (getPersonaQuery.isPending) {
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
        firstMessages: draftFirstMessages,
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
            <TextToParagraphs text={draftDescription} />
          )}
        </Stack>
      </Card>

      <Card>
        <Stack>
          <Text mb={0} fw="bold">
            First Messages
          </Text>

          {isEditing
            ? draftFirstMessages.map((draftFirstMessage, index) => (
                <Group align="flex-start" justify="space-between">
                  <Textarea
                    flex={20}
                    size="md"
                    value={draftFirstMessage}
                    onChange={(e) =>
                      setDraftFirstMessages(
                        produce((draft) => {
                          draft[index] = e.target.value;
                        }),
                      )
                    }
                    autosize
                    minRows={1}
                  />

                  <ActionIcon
                    flex={1}
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() =>
                      setDraftFirstMessages(
                        produce((draft) => {
                          draft.splice(index);
                        }),
                      )
                    }
                  >
                    <IconTrash />
                  </ActionIcon>
                </Group>
              ))
            : draftFirstMessages.map((draftFirstMessage) => (
                <Card withBorder shadow={"xl"}>
                  <TextToParagraphs text={draftFirstMessage} />
                </Card>
              ))}

          {isEditing && (
            <Button.Group>
              <Button
                onClick={() =>
                  setDraftFirstMessages(
                    produce((draft) => {
                      draft.push("");
                    }),
                  )
                }
              >
                Add
              </Button>
            </Button.Group>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
