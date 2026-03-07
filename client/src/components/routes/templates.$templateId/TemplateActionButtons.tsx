import { Button } from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { useUpdateTemplateByIdMutation } from "@/queries/templates";

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
  } = context;

  const [draftTitle] = draftTitleState;
  const [draftTemplateItems, setDraftTemplateItems] = draftTemplateItemsState;
  const [isEditing, setIsEditing] = isEditingState;
  const [draftAssistantPersonaId] = draftAssistantPersonaIdState;
  const [draftUserPersonaId] = draftUserPersonaIdState;

  const handleSave = () => {
    template.items = draftTemplateItems;

    let updatedTemplate = Object.assign({}, template, {
      title: draftTitle,
      assistantPersonaId: draftAssistantPersonaId,
      userPersonaId: draftUserPersonaId,
      items: draftTemplateItems,
    });

    updateTemplateMutation.mutate(updatedTemplate);
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setDraftTemplateItems(template.items);
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
