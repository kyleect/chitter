import { ActionIcon, Button, Group, Text, TextInput } from "@mantine/core";
import { TemplateActionButtons } from "./TemplateActionButtons";
import { IconDownload, IconGitFork } from "@tabler/icons-react";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { useStringDownload } from "@/hooks/useDownload";
import { useStartConversationMutation } from "@/queries/conversations";
import { Route } from "@/routes/templates.$templateId";
import { slugify } from "@/lib/slugify";
import { useForkTemplateByIdMutation } from "@/queries/templates";
import { modals } from "@mantine/modals";
import { StartChatModal } from "@/components/common/StartChatModal";

export const TemplateFormHeader = () => {
  const context = useContext(TemplateContext)!;
  const download = useStringDownload();
  const startConversationMutation = useStartConversationMutation();
  const forkTemplateMutation = useForkTemplateByIdMutation();
  const nav = Route.useNavigate();

  const { draftTitleState, template, isEditingState } = context;
  const [_, setShowChatLinks] = context.showChatLinksState;

  const [draftTitle, setDraftTitle] = draftTitleState;
  const [isEditing] = isEditingState;
  const [currentVariant] = context.variantState;

  const [firstMessageIndex] = context.selectedFirstMessageIndexState;

  const personasMissing =
    template.assistantPersona === null || !template.userPersona === null;

  return (
    <Group justify="space-between">
      <Group flex={1}>
        {!isEditing && (
          <Button
            variant="gradient"
            disabled={personasMissing}
            onClick={() => {
              modals.open({
                title: `Start A New Chat`,
                id: "start-new-chat",
                children: (
                  <StartChatModal
                    prompts={template.prompts ?? []}
                    key={JSON.stringify(template.prompts)}
                    onSubmit={(promptValues) => {
                      startConversationMutation.mutate(
                        {
                          templateId: template.id,
                          promptValues,
                          variantId: currentVariant ?? undefined,
                          firstMessageIndex:
                            firstMessageIndex === -1
                              ? undefined
                              : firstMessageIndex,
                        },
                        {
                          onSuccess(data) {
                            modals.closeAll();

                            nav({
                              to: "/conversations/$conversationId",
                              params: {
                                conversationId: data.id,
                              },
                            });
                          },
                        },
                      );
                    }}
                  />
                ),
                size: "xl",
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
        <Button.Group>
          <Button
            variant="subtle"
            onClick={() => {
              setShowChatLinks(true);
            }}
          >
            Chats
          </Button>
        </Button.Group>

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

        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => {
            forkTemplateMutation.mutate(template.id, {
              onSuccess(newTemplate) {
                nav({
                  to: "/templates/$templateId",
                  params: {
                    templateId: newTemplate.id,
                  },
                });
              },
            });
          }}
        >
          <IconGitFork />
        </ActionIcon>
      </Group>
    </Group>
  );
};
