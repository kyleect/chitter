import { Button } from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { useUpdateTemplateByIdMutation } from "@/queries/templates";
import { ConversationTemplate } from "server-types";

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

  const handleSave = () => {
    template.blocks = draftTemplateItems;

    let updatedTemplate: ConversationTemplate = Object.assign({}, template, {
      title: draftTitle,
      assistantPersona: draftAssistantPersona,
      userPersona: draftUserPersona,
      blocks: draftTemplateItems,
      insertableSystemPrompts: draftInsertables,
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
