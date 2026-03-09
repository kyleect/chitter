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
    draftTemplateItemsState,
    draftAssistantPersonaIdState,
    draftUserPersonaIdState,
    isEditingState,
    draftInsertablesState,
  } = context;

  const [draftTitle] = draftTitleState;
  const [draftTemplateItems, setDraftTemplateItems] = draftTemplateItemsState;
  const [isEditing, setIsEditing] = isEditingState;
  const [draftAssistantPersonaId] = draftAssistantPersonaIdState;
  const [draftUserPersonaId] = draftUserPersonaIdState;
  const [draftInsertables, setDraftInsertables] = draftInsertablesState;

  const handleSave = () => {
    template.items = draftTemplateItems;

    let updatedTemplate: ConversationTemplate = Object.assign({}, template, {
      title: draftTitle,
      assistantPersonaId: draftAssistantPersonaId,
      userPersonaId: draftUserPersonaId,
      items: draftTemplateItems,
      insertableSystemPrompts: draftInsertables,
    });

    updateTemplateMutation.mutate(updatedTemplate);
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setDraftTemplateItems(template.items);
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
