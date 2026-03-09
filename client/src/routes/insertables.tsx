import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import {
  useGetInsertablesQuery,
  useUpdateInsertablesMutation,
} from "@/queries/insertables";
import {
  ActionIcon,
  ActionIconGroup,
  Alert,
  Badge,
  Card,
  Loader,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconDeviceFloppy,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/insertables")({
  component: RouteComponent,
});

function RouteComponent() {
  const getInsertablesQuery = useGetInsertablesQuery();
  const updateInsertablesMutation = useUpdateInsertablesMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftInsertables, setDraftInsertables] = useState<[string, string][]>(
    [],
  );

  useEffect(() => {
    getInsertablesQuery.data && setDraftInsertables(getInsertablesQuery.data);
  }, [getInsertablesQuery.data]);

  if (getInsertablesQuery.isPending) {
    return <Loader />;
  }

  if (getInsertablesQuery.isError) {
    return (
      <Alert color="red">
        Error fetching insertables: {getInsertablesQuery.error.message}
      </Alert>
    );
  }

  return (
    <Stack>
      {draftInsertables.map(([title, content], index) => {
        return isEditing ? (
          <Card>
            <Stack>
              <TextInput
                required
                label="Title"
                value={title}
                onChange={(e) => {
                  setDraftInsertables(
                    produce((draft) => {
                      draft[index] = [e.target.value, draft[index][1]];
                    }),
                  );
                }}
              />

              <Textarea
                required
                label="Content"
                value={content}
                onChange={(e) => {
                  setDraftInsertables(
                    produce((draft) => {
                      const idx = draft.findIndex((x) => x[0] === title);
                      draft[idx] = [draft[idx][0], e.target.value];
                    }),
                  );
                }}
                autosize
                minRows={1}
              />

              {isEditing && (
                <ActionIcon.Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => {
                      modals.openConfirmModal({
                        title: "Delete Insertable System Prompt?",
                        labels: {
                          confirm: "Delete",
                          cancel: "Don't Delete",
                        },
                        confirmProps: {
                          color: "red",
                        },
                        onConfirm() {
                          setDraftInsertables(
                            produce((draft) => {
                              draft.splice(index, 1);
                            }),
                          );
                        },
                      });
                    }}
                  >
                    <IconTrash stroke={1.0} />
                  </ActionIcon>
                </ActionIcon.Group>
              )}
            </Stack>
          </Card>
        ) : (
          <Card>
            <Stack>
              <Badge color="violet" radius="sm">
                {title}
              </Badge>

              <TextToParagraphs text={content} paragraphClamp={1} />
            </Stack>
          </Card>
        );
      })}

      <ActionIconGroup>
        <ActionIcon
          color="violet"
          onClick={() => {
            setIsEditing(true);
            setDraftInsertables(
              produce((draft) => {
                draft.push(["", ""]);
              }),
            );
          }}
        >
          <IconPlus />
        </ActionIcon>
        {isEditing ? (
          <ActionIcon
            color="violet"
            onClick={() => {
              updateInsertablesMutation.mutate(draftInsertables, {
                onSuccess() {
                  setIsEditing(false);
                },
              });
            }}
          >
            <IconDeviceFloppy />
          </ActionIcon>
        ) : (
          <ActionIcon
            color="violet"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            <IconEdit stroke={1.5} />
          </ActionIcon>
        )}
      </ActionIconGroup>
    </Stack>
  );
}
