import {
  useGetTemplateByIdPreviewQuery,
  useGetTemplateByIdQuery,
} from "@/queries/templates";
import { Alert, Divider, Drawer, Loader, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ConversationTemplate,
  Persona,
  TemplatePersona,
  TemplateVariant,
} from "server-types";
import { ConversationPreviewDrawer } from "@/components/routes/templates.$templateId/ConversationPreviewDrawer";
import { useGetPersonasQuery } from "@/queries/personas";
import { useGetSettingsQuery } from "@/queries/settings";
import { TemplateContext } from "@/components/routes/templates.$templateId/TemplateContext";
import { TemplateFormHeader } from "@/components/routes/templates.$templateId/TemplateFormHeader";
import { TemplateFormPersonas } from "@/components/routes/templates.$templateId/TemplateFormPersonas";
import { TemplateFormAffix } from "@/components/routes/templates.$templateId/TemplateFormAffix";
import { TemplateFormBlocks } from "@/components/routes/templates.$templateId/TemplateFormBlocks";
import { TemplateFormInsertable } from "@/components/routes/templates.$templateId/TemplateFormInsertable";
import { TemplateVariants } from "@/components/routes/templates.$templateId/TemplateVariants";
import { useGetConservationsQuery } from "@/queries/conversations";
import { LinkToConversation } from "@/components/common/LinkToConversation";

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
  const [showChatLinks, setShowChatLink] = useState(false);
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [selectedFirstMessageIndex, setSelectdFirstMessageIndex] =
    useState<number>(-1);
  const [opened, { open, close }] = useDisclosure(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTemplateItems, setDraftTemplateItems] = useState<
    ConversationTemplate["blocks"]
  >([]);
  const [draftVariantItems, setDraftVariantItems] = useState<
    TemplateVariant["blocks"]
  >([]);
  const [draftInsertables, setDraftInsertables] = useState<[string, string][]>(
    [],
  );
  const getTemplateByIdPreviewQuery = useGetTemplateByIdPreviewQuery(
    params.templateId,
    previewConversationAtIndex,
    currentVariant ?? undefined,
  );

  const getSettingsQuery = useGetSettingsQuery();
  const getConversationsQuery = useGetConservationsQuery();
  const [draftUserPersona, setDraftUserPersona] =
    useState<TemplatePersona | null>(null);
  const [draftAssistantPersona, setDraftAssistantPersona] =
    useState<TemplatePersona | null>(null);

  const getPersonasQuery = useGetPersonasQuery();

  useEffect(() => {
    const templateBlocks = getTemplateByIdQuery.data?.blocks ?? [];

    setDraftTemplateItems(templateBlocks);
  }, [getTemplateByIdQuery.data]);

  useEffect(() => {
    const varientBlocks =
      getTemplateByIdQuery.data?.variants.find(
        (variant) => variant.id === currentVariant,
      )?.blocks ?? [];

    setDraftVariantItems(varientBlocks);
  }, [currentVariant]);

  useEffect(() => {
    if (getTemplateByIdQuery.data) {
      setDraftAssistantPersona(getTemplateByIdQuery.data.assistantPersona);
      setDraftUserPersona(getTemplateByIdQuery.data.userPersona);
      setDraftTitle(getTemplateByIdQuery.data.title ?? "");
      setDraftInsertables(
        getTemplateByIdQuery.data.insertableSystemPrompts ?? [],
      );
    }
  }, [getTemplateByIdQuery.data]);

  if (
    getTemplateByIdQuery.isPending ||
    getTemplateByIdPreviewQuery.isPending ||
    getPersonasQuery.isPending ||
    getSettingsQuery.isPending ||
    getConversationsQuery.isPending
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

  if (getConversationsQuery.isError) {
    return (
      <Alert color="red">
        Failed to load conversations:{" "}
        {JSON.stringify(getConversationsQuery.error)}
      </Alert>
    );
  }

  const template = getTemplateByIdQuery.data!;

  if (!template || !draftTemplateItems) {
    return <Alert color="blue">Template not found</Alert>;
  }

  let assistantPersonaResolved: Persona | undefined;

  switch (template.assistantPersona?.type) {
    case "Id":
      const foundPersona = (getPersonasQuery.data ?? []).find(
        (x) => x.id === template.assistantPersona?.data,
      );

      if (foundPersona) {
        assistantPersonaResolved = foundPersona;
      }

      break;

    case "Embedded":
      assistantPersonaResolved = template.assistantPersona.data;
      break;
  }

  const hasVariants = template.variants.length > 0;

  return (
    <TemplateContext
      value={{
        template,
        selectedFirstMessageIndexState: [
          selectedFirstMessageIndex,
          setSelectdFirstMessageIndex,
        ],
        variantState: [currentVariant, setCurrentVariant],
        isEditingState: [isEditing, setIsEditing],
        draftTitleState: [draftTitle, setDraftTitle],
        draftUserPersonaState: [draftUserPersona, setDraftUserPersona],
        draftAssistantPersonaState: [
          draftAssistantPersona,
          setDraftAssistantPersona,
        ],
        showChatLinksState: [showChatLinks, setShowChatLink],
        assistantPersonaResolved: assistantPersonaResolved ?? null,
        draftInsertablesState: [draftInsertables, setDraftInsertables],
        draftTemplateBlocksState: [draftTemplateItems, setDraftTemplateItems],
        draftVariantBlocksState: [draftVariantItems, setDraftVariantItems],
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

          {hasVariants && (
            <>
              <Divider
                label={"Varients"}
                labelPosition="left"
                mt="md"
                mb="md"
              />

              <TemplateVariants />
            </>
          )}

          <Divider label={"Personas"} labelPosition="left" mt="md" mb="md" />

          <TemplateFormPersonas />

          <Divider label={"Blocks"} labelPosition="left" mt="md" mb="md" />

          <TemplateFormBlocks />

          <Divider
            label={"Insertable System Prompts"}
            labelPosition="left"
            mt="md"
            mb="md"
          />

          <TemplateFormInsertable />
        </Stack>

        <ConversationPreviewDrawer
          templateByIdPreview={getTemplateByIdPreviewQuery.data}
        />

        <TemplateFormAffix />

        <Drawer
          opened={showChatLinks}
          onClose={() => {
            setShowChatLink(false);
          }}
        >
          <Stack>
            <Text fw="bold">Conversations</Text>
            {getConversationsQuery.data
              .filter(({ templateId }) => templateId === template.id)
              .map(({ id }) => (
                <LinkToConversation conversationId={id} />
              ))}
          </Stack>
        </Drawer>
      </Stack>
    </TemplateContext>
  );
}
