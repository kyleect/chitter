import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONSERVATION_KEYS } from "./conversations";
import { Conversation } from "server-types";

export const useCompletionMutation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    // When mutate is called:
    onMutate: async (prompt: string) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData<Conversation>(
        CONSERVATION_KEYS.detail(conversationId),
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Conversation>(
        CONSERVATION_KEYS.detail(conversationId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            messages: [
              ...old.messages,
              {
                kind: "Message",
                role: { kind: "user" },
                message: prompt,
              },
            ],
          };
        },
      );

      // Return a result with the previous and new todo
      return { previousConversation };
    },
    // If the mutation fails, use the result we returned above
    onError: (_, __, onMutateResult) => {
      queryClient.setQueryData(
        CONSERVATION_KEYS.detail(conversationId),
        onMutateResult?.previousConversation,
      );
    },
    // Always refetch after error or success:
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      }),
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

      return data.response;
    },
  });
};
