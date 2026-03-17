import { useUpdateSettingsMutation } from "@/queries/settings";
import { useSettingsContext } from "./SettingsContext";
import { Button } from "@mantine/core";

export const SaveSettingsButton = () => {
  let updateSettingsMutation = useUpdateSettingsMutation();
  const context = useSettingsContext()!;

  const [draftSettings] = context.state;

  function onSave() {
    if (draftSettings === null) return;
    updateSettingsMutation.mutate(draftSettings);
  }

  return (
    <Button.Group>
      <Button onClick={onSave}>Save</Button>
    </Button.Group>
  );
};
