import { FC, useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import {
  ActionIcon,
  ActionIconGroup,
  Badge,
  Card,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { produce } from "immer";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { modals } from "@mantine/modals";

type Props = {};

export const TemplateFormInsertable: FC<Props> = () => {
  const context = useContext(TemplateContext)!;

  const { draftInsertablesState } = context;
  const [isEditing, setIsEditing] = context.isEditingState;
  const [draftInsertables, setDraftInsertables] = draftInsertablesState;

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
          size="sm"
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
      </ActionIconGroup>
    </Stack>
  );
};
