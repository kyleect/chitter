import { Alert, Select } from "@mantine/core";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";

export const TemplateVariants = () => {
  const context = useContext(TemplateContext)!;

  const template = context.template;
  const [currentVariant, setCurrentVariant] = context.variantState;
  const [isEditing] = context.isEditingState;

  return isEditing ? (
    <Alert>Editing template variants isn't currently supported</Alert>
  ) : (
    <Select
      value={currentVariant ?? "default"}
      onChange={(e) => {
        setCurrentVariant(e ?? "default");
      }}
      allowDeselect={false}
      data={[
        { value: "default", label: "Default" },
        ...template.variants.map((variant) => {
          return { value: variant.id, label: variant.title };
        }),
      ]}
    />
  );
};
