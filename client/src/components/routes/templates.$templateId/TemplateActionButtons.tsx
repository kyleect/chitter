import { Button } from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { useUpdateTemplateByIdMutation } from "@/queries/templates";
import { ConversationTemplate } from "server-types";
import { notifications } from "@mantine/notifications";

export const TemplateActionButtons = () => {
  const updateTemplateMutation = useUpdateTemplateByIdMutation();
  const context = useContext(TemplateContext)!;

  const {
    template,
    draftTitleState,
    draftTemplateBlocksState: draftTemplateItemsState,
    draftAssistantPersonaState,
    draftUserPersonaState,
    isEditingState,
    draftInsertablesState,
  } = context;

  const [draftTitle] = draftTitleState;
  const [draftTemplateItems, setDraftTemplateItems] = draftTemplateItemsState;
  const [isEditing, setIsEditing] = isEditingState;
  const [draftAssistantPersona] = draftAssistantPersonaState;
  const [draftUserPersona] = draftUserPersonaState;
  const [draftInsertables, setDraftInsertables] = draftInsertablesState;
  const [draftPrompts, setDraftPrompts] = context.draftPromptsState;

  const handleSave = () => {
    template.blocks = draftTemplateItems;

    const promptsAreComplete = draftPrompts.every(
      (prompt) => prompt.key.length > 0 && prompt.prompt.length > 0,
    );

    if (!promptsAreComplete) {
      notifications.show({
        color: "red",
        message: "Some prompts are incomplete",
      });

      return;
    }

    let updatedTemplate: ConversationTemplate = Object.assign({}, template, {
      title: draftTitle,
      assistantPersona: draftAssistantPersona,
      userPersona: draftUserPersona,
      blocks: draftTemplateItems,
      insertableSystemPrompts: draftInsertables,
      prompts: draftPrompts,
    } as ConversationTemplate);

    console.log(updatedTemplate);

    updateTemplateMutation.mutate(updatedTemplate, {
      onSuccess() {
        setIsEditing(!isEditing);
      },
    });
  };

  const handleCancel = () => {
    setDraftTemplateItems(template.blocks);
    setDraftInsertables(template.insertableSystemPrompts);
    setDraftPrompts(template.prompts ?? []);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleDelete = () => {};

  return (
    <Button.Group>
      {isEditing && (
        <>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="light" onClick={handleCancel}>
            Cancel
          </Button>
        </>
      )}

      {!isEditing && (
        <>
          <Button onClick={handleEdit}>Edit</Button>
        </>
      )}

      <Button variant="outline" onClick={handleDelete}>
        Delete
      </Button>
    </Button.Group>
  );
};
