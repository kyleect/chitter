import {
  useGetTemplateByIdPreviewQuery,
  useGetTemplateByIdQuery,
} from "@/queries/templates";
import { Alert, Divider, Loader, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConversationTemplate } from "server-types";
import { ConversationPreviewDrawer } from "@/components/routes/templates.$templateId/ConversationPreviewDrawer";
import { useGetPersonasQuery } from "@/queries/personas";
import { useGetSettingsQuery } from "@/queries/settings";
import { TemplateContext } from "@/components/routes/templates.$templateId/TemplateContext";
import { TemplateFormHeader } from "@/components/routes/templates.$templateId/TemplateFormHeader";
import { TemplateFormPersonas } from "@/components/routes/templates.$templateId/TemplateFormPersonas";
import { TemplateFormAffix } from "@/components/routes/templates.$templateId/TemplateFormAffix";
import { TemplateFormBlocks } from "@/components/routes/templates.$templateId/TemplateFormBlocks";

type Search = {
  at?: number;
};

export const Route = createFileRoute("/templates/$templateId")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): Search => {
    return { ...search };
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const [previewConversationAtIndex, setPreviewConversationAtIndexState] =
    useState<number | undefined>();
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [opened, { open, close }] = useDisclosure(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTemplateItems, setDraftTemplateItems] = useState<
    ConversationTemplate["items"]
  >([]);
  const getTemplateByIdPreviewQuery = useGetTemplateByIdPreviewQuery(
    params.templateId,
    previewConversationAtIndex,
  );

  const getSettingsQuery = useGetSettingsQuery();
  const [draftUserPersonaId, setDraftUserPersonaId] = useState<string | null>(
    getSettingsQuery.data?.default_user_persona_id ?? null,
  );
  const [draftAssistantPersonaId, setDraftAssistantPersonaId] = useState<
    string | null
  >(getSettingsQuery.data?.default_assistant_persona_id ?? null);

  const getPersonasQuery = useGetPersonasQuery();

  useEffect(() => {
    setDraftTemplateItems(getTemplateByIdQuery.data?.items ?? []);
  }, [getTemplateByIdQuery.data]);

  useEffect(() => {
    if (getTemplateByIdQuery.data) {
      setDraftAssistantPersonaId(getTemplateByIdQuery.data.assistantPersonaId);
      setDraftUserPersonaId(getTemplateByIdQuery.data.userPersonaId);
      setDraftTitle(getTemplateByIdQuery.data.title ?? "");
    }
  }, [getTemplateByIdQuery.data]);

  if (
    getTemplateByIdQuery.isPending &&
    getTemplateByIdPreviewQuery.isPending &&
    getPersonasQuery.isPending &&
    getSettingsQuery.isPending
  ) {
    return <Loader />;
  }

  if (getTemplateByIdQuery.isError) {
    return (
      <Alert color="red">
        Failed to load template: {JSON.stringify(getTemplateByIdQuery.error)}
      </Alert>
    );
  }

  if (getTemplateByIdPreviewQuery.isError) {
    return (
      <Alert color="red">
        Failed to load template preview:{" "}
        {JSON.stringify(getTemplateByIdPreviewQuery.error)}
      </Alert>
    );
  }

  if (getPersonasQuery.isError) {
    return (
      <Alert color="red">
        Failed to load personas: {JSON.stringify(getPersonasQuery.error)}
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

  const template = getTemplateByIdQuery.data;

  if (!template || !draftTemplateItems) {
    return <Alert color="blue">Template not found</Alert>;
  }

  return (
    <TemplateContext
      value={{
        template,
        isEditingState: [isEditing, setIsEditing],
        draftTitleState: [draftTitle, setDraftTitle],
        draftUserPersonaIdState: [draftUserPersonaId, setDraftUserPersonaId],
        draftAssistantPersonaIdState: [
          draftAssistantPersonaId,
          setDraftAssistantPersonaId,
        ],
        draftTemplateItemsState: [draftTemplateItems, setDraftTemplateItems],
        previewConversationAtIndexState: [
          previewConversationAtIndex,
          setPreviewConversationAtIndexState,
        ],
        previewConversationModal: {
          open,
          close,
          opened,
        },
      }}
    >
      <Stack>
        <Stack>
          <TemplateFormHeader />

          <Divider label={"Personas"} labelPosition="left" mt="md" mb="md" />

          <TemplateFormPersonas />

          <Divider label={"Blocks"} labelPosition="left" mt="md" mb="md" />

          <TemplateFormBlocks />
        </Stack>

        <ConversationPreviewDrawer
          templateByIdPreview={getTemplateByIdPreviewQuery.data}
        />

        <TemplateFormAffix />
      </Stack>
    </TemplateContext>
  );
}
