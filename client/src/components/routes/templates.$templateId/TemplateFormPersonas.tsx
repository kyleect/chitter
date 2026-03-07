import { AssistantIcon } from "@/components/common/AssistantIcon";
import { Alert, Group, Select, ThemeIcon } from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { UserIcon } from "@/components/common/UserIcon";
import { Link } from "@tanstack/react-router";
import { useGetPersonasQuery } from "@/queries/personas";

export const TemplateFormPersonas = () => {
  const getPersonasQuery = useGetPersonasQuery();
  const context = useContext(TemplateContext)!;

  const {
    isEditingState,
    draftAssistantPersonaIdState,
    draftUserPersonaIdState,
  } = context;

  const [isEditing] = isEditingState;
  const [draftAssistantPersonaId, setDraftAssistantPersonaId] =
    draftAssistantPersonaIdState;
  const [draftUserPersonaId, setDraftUserPersonaId] = draftUserPersonaIdState;

  const personasMissing =
    !context?.template.assistantPersonaId || !context?.template.userPersonaId;

  return (
    <>
      <Group gap="xl">
        <Group gap="xs">
          <ThemeIcon variant="subtle">
            <AssistantIcon color="white" />
          </ThemeIcon>
          {isEditing ? (
            <Select
              size="md"
              data={getPersonasQuery.data?.map((persona) => ({
                value: persona.id,
                label: persona.name,
              }))}
              value={draftAssistantPersonaId}
              onChange={(newId) => setDraftAssistantPersonaId(newId)}
            />
          ) : (
            <Link
              to="/personas/$personaId"
              params={{
                personaId: draftAssistantPersonaId ?? "",
              }}
            >
              {
                getPersonasQuery.data?.find(
                  (persona) => persona.id === draftAssistantPersonaId,
                )?.name
              }
            </Link>
          )}
        </Group>

        <Group>
          <ThemeIcon variant="subtle">
            <UserIcon color="white" />
          </ThemeIcon>
          {isEditing ? (
            <Select
              size="md"
              data={getPersonasQuery.data?.map((persona) => ({
                value: persona.id,
                label: persona.name,
              }))}
              value={draftUserPersonaId}
              onChange={(newId) => setDraftUserPersonaId(newId)}
            />
          ) : (
            <Link
              to="/personas/$personaId"
              params={{
                personaId: draftUserPersonaId ?? "",
              }}
            >
              {
                getPersonasQuery.data?.find(
                  (persona) => persona.id === draftUserPersonaId,
                )?.name
              }
            </Link>
          )}
        </Group>
      </Group>

      {personasMissing && (
        <Alert title="Personas Required" color="red">
          An assistant and user persona are required to start a conversation.
          Click edit button to assign personas.
        </Alert>
      )}
    </>
  );
};
