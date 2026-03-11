import { AssistantIcon } from "@/components/common/AssistantIcon";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { UserIcon } from "@/components/common/UserIcon";
import { Link } from "@tanstack/react-router";
import { useGetPersonasQuery } from "@/queries/personas";
import { isEmbeddedPersona, isPersonaId } from "@/queries/templates";
import { produce } from "immer";
import { v4 as uuidv4 } from "uuid";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";
import { IconTrash } from "@tabler/icons-react";

export const TemplateFormPersonas = () => {
  const context = useContext(TemplateContext)!;
  const [draftAssistantPersona, setDraftAssistantPersona] =
    context.draftAssistantPersonaState;
  const [draftUserPersona, setDraftUserPersona] = context.draftUserPersonaState;
  const getPersonasQuery = useGetPersonasQuery();
  const [isEditing, setIsEditing] = context.isEditingState;

  if (getPersonasQuery.isPending) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Error fetching personas: {getPersonasQuery.error.message}
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="subtle">
            <AssistantIcon color="white" />
          </ThemeIcon>

          <AssistantName />
        </Group>

        {isEmbeddedPersona(draftAssistantPersona) && (
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => {
              setIsEditing(true);
              setDraftAssistantPersona(null);
            }}
          >
            <IconTrash stroke={1.0} />
          </ActionIcon>
        )}

        {(isPersonaId(draftAssistantPersona) ||
          draftAssistantPersona === null) && (
          <Button
            size="compact-sm"
            variant="subtle"
            onClick={() => {
              setDraftAssistantPersona(
                produce((draft) => {
                  setIsEditing(true);

                  if (!draft) {
                    return {
                      type: "Embedded",
                      data: {
                        id: uuidv4(),
                        name: "New Assistant Persona",
                        description: "",
                      },
                    };
                  }

                  if (isPersonaId(draft)) {
                    const personaFromQuery = getPersonasQuery.data.find(
                      (persona) => persona.id === draft.data,
                    )!;

                    // @ts-expect-error Typescript doesn't recognize I'm wanting to change it's type
                    draft.type = "Embedded";
                    // @ts-expect-error Typescript doesn't recognize I'm wanting to change it's type
                    draft.data = {
                      ...personaFromQuery,
                      id: uuidv4(),
                    };
                  }
                }),
              );
            }}
          >
            Embed Persona
          </Button>
        )}
      </Group>

      {isEmbeddedPersona(draftAssistantPersona) &&
        (isEditing ? (
          <Textarea
            size="md"
            autosize
            minRows={1}
            value={draftAssistantPersona.data.description}
            onChange={(e) => {
              setDraftAssistantPersona(
                produce((draft) => {
                  if (isEmbeddedPersona(draft)) {
                    draft.data.description = e.target.value;
                  }
                }),
              );
            }}
          />
        ) : (
          <TextToParagraphs
            text={draftAssistantPersona.data.description}
            paragraphClamp={4}
          />
        ))}

      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="subtle">
            <UserIcon color="white" />
          </ThemeIcon>

          <UserName />
        </Group>

        {isEmbeddedPersona(draftUserPersona) && (
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => {
              setIsEditing(true);
              setDraftUserPersona(null);
            }}
          >
            <IconTrash stroke={1.0} />
          </ActionIcon>
        )}

        {(isPersonaId(draftUserPersona) || draftUserPersona === null) && (
          <Button
            size="compact-sm"
            variant="subtle"
            onClick={() => {
              setDraftUserPersona(
                produce((draft) => {
                  setIsEditing(true);

                  if (!draft) {
                    return {
                      type: "Embedded",
                      data: {
                        id: uuidv4(),
                        name: "New User Persona",
                        description: "",
                      },
                    };
                  }

                  if (isPersonaId(draft)) {
                    const personaFromQuery = getPersonasQuery.data.find(
                      (persona) => persona.id === draft.data,
                    )!;

                    // @ts-expect-error Typescript doesn't recognize I'm wanting to change it's type
                    draft.type = "Embedded";
                    // @ts-expect-error Typescript doesn't recognize I'm wanting to change it's type
                    draft.data = {
                      ...personaFromQuery,
                      id: uuidv4(),
                    };
                  }
                }),
              );
            }}
          >
            Embed Persona
          </Button>
        )}
      </Group>

      {isEmbeddedPersona(draftUserPersona) &&
        (isEditing ? (
          <Textarea
            size="md"
            autosize
            minRows={1}
            value={draftUserPersona.data.description}
            onChange={(e) => {
              setDraftUserPersona(
                produce((draft) => {
                  if (isEmbeddedPersona(draft)) {
                    draft.data.description = e.target.value;
                  }
                }),
              );
            }}
          />
        ) : (
          <TextToParagraphs text={draftUserPersona.data.description} />
        ))}
    </Stack>
  );
};

const AssistantName = () => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const [draftAssistantPersona, setDraftAssistantPersona] =
    context.draftAssistantPersonaState;

  const getPersonasQuery = useGetPersonasQuery();

  if (getPersonasQuery.isPending) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Error fetching personas: {getPersonasQuery.error.message}
      </Alert>
    );
  }

  switch (true) {
    case isPersonaId(draftAssistantPersona):
      return isEditing ? (
        <Select
          size="md"
          data={getPersonasQuery.data.map((persona) => ({
            value: persona.id,
            label: persona.name,
          }))}
          value={draftAssistantPersona.data}
          onChange={(newId) => {
            if (newId === null) {
              setDraftAssistantPersona(null);
              return;
            }
            return setDraftAssistantPersona({
              type: "Id",
              data: newId ?? "", // TODO
            });
          }}
        />
      ) : (
        <Link
          to="/personas/$personaId"
          params={{
            personaId: draftAssistantPersona.data ?? "",
          }}
        >
          {
            getPersonasQuery.data.find(
              (persona) => persona.id === draftAssistantPersona.data,
            )?.name
          }
        </Link>
      );

    case isEmbeddedPersona(draftAssistantPersona):
      return isEditing ? (
        <TextInput
          size="md"
          value={draftAssistantPersona.data.name}
          onChange={(e) => {
            setDraftAssistantPersona(
              produce((draft) => {
                if (isEmbeddedPersona(draft)) {
                  draft.data.name = e.target.value;
                }
              }),
            );
          }}
        />
      ) : (
        <Text>{draftAssistantPersona.data.name}</Text>
      );

    default:
      return isEditing ? (
        <Select
          size="md"
          allowDeselect
          data={[
            ...getPersonasQuery.data.map((persona) => ({
              value: persona.id,
              label: persona.name,
            })),
          ]}
          value={null}
          onChange={(newId) => {
            if (newId === "" || newId === null) {
              setDraftAssistantPersona(null);

              return;
            }

            return setDraftAssistantPersona({
              type: "Id",
              data: newId ?? "", // TODO
            });
          }}
        />
      ) : (
        <Text>No Persona Set</Text>
      );
  }
};

const UserName = () => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const [draftUserPersona, setDraftUserPersona] = context.draftUserPersonaState;

  const getPersonasQuery = useGetPersonasQuery();

  if (getPersonasQuery.isPending) {
    return <Loader />;
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Error fetching personas: {getPersonasQuery.error.message}
      </Alert>
    );
  }

  switch (true) {
    case isPersonaId(draftUserPersona):
      return isEditing ? (
        <Select
          size="md"
          data={getPersonasQuery.data.map((persona) => ({
            value: persona.id,
            label: persona.name,
          }))}
          value={draftUserPersona.data}
          onChange={(newId) => {
            if (newId === null) {
              setDraftUserPersona(null);
              return;
            }
            return setDraftUserPersona({
              type: "Id",
              data: newId ?? "", // TODO
            });
          }}
        />
      ) : (
        <Link
          to="/personas/$personaId"
          params={{
            personaId: draftUserPersona.data ?? "",
          }}
        >
          {
            getPersonasQuery.data.find(
              (persona) => persona.id === draftUserPersona.data,
            )?.name
          }
        </Link>
      );

    case isEmbeddedPersona(draftUserPersona):
      return isEditing ? (
        <TextInput
          size="md"
          value={draftUserPersona.data.name}
          onChange={(e) => {
            setDraftUserPersona(
              produce((draft) => {
                if (isEmbeddedPersona(draft)) {
                  draft.data.name = e.target.value;
                }
              }),
            );
          }}
        />
      ) : (
        <Text>{draftUserPersona.data.name}</Text>
      );

    default:
      return isEditing ? (
        <Select
          size="md"
          allowDeselect
          data={[
            ...getPersonasQuery.data.map((persona) => ({
              value: persona.id,
              label: persona.name,
            })),
          ]}
          value={null}
          onChange={(newId) => {
            if (newId === "" || newId === null) {
              setDraftUserPersona(null);

              return;
            }

            return setDraftUserPersona({
              type: "Id",
              data: newId ?? "", // TODO
            });
          }}
        />
      ) : (
        <Text>No Persona Set</Text>
      );
  }
};
