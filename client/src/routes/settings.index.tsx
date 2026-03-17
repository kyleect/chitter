import { DefaultPersonasSettings } from "@/components/routes/settings.index/DefaultPersonasSettings";
import { LLMConnectionSettings } from "@/components/routes/settings.index/LLMConnectionSettings";
import { LLMParameterSettings } from "@/components/routes/settings.index/LLMParameterSettings";
import { SaveSettingsButton } from "@/components/routes/settings.index/SaveSettingsButton";
import { SettingsContext } from "@/components/routes/settings.index/SettingsContext";
import { useGetSettingsQuery } from "@/queries/settings";
import { Alert, Loader, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSettings } from "server-types";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  let getSettingsQuery = useGetSettingsQuery();
  let [draftSettings, setDraftSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setDraftSettings(getSettingsQuery.data ?? null);
  }, [getSettingsQuery.data]);

  if (getSettingsQuery.isPending) {
    return <Loader />;
  }

  if (getSettingsQuery.isError) {
    return (
      <Alert color="red">
        Failed to load settings: {JSON.stringify(getSettingsQuery.error)}
      </Alert>
    );
  }

  return (
    <SettingsContext
      value={{
        state: [draftSettings, setDraftSettings],
      }}
    >
      <Stack>
        <SaveSettingsButton />

        <Title order={2}>Settings</Title>

        <DefaultPersonasSettings />

        <LLMConnectionSettings />

        <LLMParameterSettings />
      </Stack>
    </SettingsContext>
  );
}
