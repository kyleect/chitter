import { useMutation, useQuery } from "@tanstack/react-query";
import { DebugInfo } from "server-types";

export const DEBUG_KEYS = {
  all: ["debug"] as const,
} as const;

export const useGetDebugInfoQuery = () =>
  useQuery({
    queryKey: DEBUG_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/debug`);

      const body = await response.text();

      if (!response.ok) {
        switch (response.status) {
          default:
            throw new Error(`Failed to get debug information: ${body}`);
        }
      }

      const data = JSON.parse(body) as DebugInfo;

      return data;
    },
  });

type BackupCallbacks = {
  onRequestSuccess?: (backupFileName: string) => void;
  onRequestError?: (e: Error) => void;
  onValidationErrors?: (errs: string[]) => void;
};

export const useDebugBackupMutation = (callbacks?: BackupCallbacks) =>
  useMutation({
    mutationFn: async () =>
      await fetch(`/api/debug/backup`, {
        method: "POST",
      }),
    onSuccess: async (response) => {
      const backupFileName = await response.text();

      callbacks?.onRequestSuccess?.call(undefined, backupFileName);
    },
  });

export const useTriggerTestAchievementMutation = () =>
  useMutation({
    mutationFn: async () =>
      await fetch(`/api/debug/achievement`, {
        method: "POST",
      }),
  });
