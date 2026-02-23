import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONSERVATION_KEYS } from "./conversations";

export const useCompletionMutation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    onSuccess: async () => {
      const queryKey = CONSERVATION_KEYS.detail(conversationId);

      debugger;

      await queryClient.invalidateQueries({
        queryKey,
      });
    },
    onError(_, __, ___) {
      debugger;
    },
    mutationFn: async (prompt: string) => {
      const response = await fetch(`/api/completions`, {
        method: "POST",
        body: JSON.stringify({
          prompt,
          conversation_id: conversationId,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as {
        response: string;
      };

      debugger;

      return data.response;
    },
  });
};
