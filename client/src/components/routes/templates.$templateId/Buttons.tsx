import { Button } from "@mantine/core";

export const Buttons = ({
  isEditing,
  handleCancel,
  handleDelete,
  handleEdit,
  handleSave,
}: {
  isEditing: boolean;
  handleCancel: () => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleDelete: () => void;
}) => (
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
