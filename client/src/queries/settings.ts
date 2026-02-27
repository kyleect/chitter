import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSettings } from "server-types";

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
} as const;

export const useGetSettingsQuery = () =>
  useQuery({
    queryKey: SETTINGS_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/settings`);
      const data = (await response.json()) as AppSettings;

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update settings: ${error}`);
      }

      return data;
    },
  });

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedSettings: AppSettings) => {
      const response = await fetch(`/api/settings`, {
        method: "POST",
        body: JSON.stringify(updatedSettings, null, 2),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update settings: ${error}`);
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
    },
  });
};
