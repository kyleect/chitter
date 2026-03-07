import { ActionIcon, Button, Group, Text, TextInput } from "@mantine/core";
import { TemplateActionButtons } from "./TemplateActionButtons";
import { IconDownload } from "@tabler/icons-react";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { useStringDownload } from "@/hooks/useDownload";
import { useStartConversationMutation } from "@/queries/conversations";
import { Route } from "@/routes/templates.$templateId";
import { slugify } from "@/lib/slugify";

export const TemplateFormHeader = () => {
  const context = useContext(TemplateContext)!;
  const download = useStringDownload();
  const startConversationMutation = useStartConversationMutation();
  const nav = Route.useNavigate();

  const { draftTitleState, template, isEditingState } = context;

  const [draftTitle, setDraftTitle] = draftTitleState;
  const [isEditing] = isEditingState;

  const personasMissing =
    !template.assistantPersonaId || !template.userPersonaId;

  return (
    <Group justify="space-between">
      <Group flex={1}>
        {!isEditing && (
          <Button
            variant="gradient"
            disabled={personasMissing}
            onClick={() => {
              startConversationMutation.mutate(template.id, {
                onSuccess(data) {
                  nav({
                    to: "/conversations/$conversationId",
                    params: {
                      conversationId: data.id,
                    },
                  });
                },
              });
            }}
          >
            Chat
          </Button>
        )}

        {isEditing ? (
          <Group gap="xs" flex={1}>
            <Text fw="bold" size="lg" mb={0} mt={0}>
              Title:
            </Text>
            <TextInput
              size="sm"
              flex={1}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </Group>
        ) : (
          <Text fw="bold" size="lg">
            Template: {draftTitle ?? template.id}
          </Text>
        )}
      </Group>
      <Group>
        <TemplateActionButtons />

        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => {
            download(
              JSON.stringify(context?.template),
              `${slugify(template.title)}-template_${template.id}.json`,
            );
          }}
        >
          <IconDownload />
        </ActionIcon>
      </Group>
    </Group>
  );
};
