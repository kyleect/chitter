import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONSERVATION_KEYS } from "./conversations";
import {
  CompletionRequestBody,
  Conversation,
  GenerateResponseRequestBody,
  RegenerateResponseRequestBody,
} from "server-types";

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
      const response = await fetch(`/api/chat_completions`, {
        method: "POST",
        body: JSON.stringify({
          prompt,
          conversation_id: conversationId,
          settings: {
            temperature: 1.0,
          },
        } as CompletionRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Couldn't generate chat completion: ${error}`);
      }

      const data = (await response.json()) as {
        response: string;
      };

      return data.response;
    },
  });
};

export const useGenerateResponseMutation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      }),
    mutationFn: async () => {
      const response = await fetch(`/api/chat_completions/generate_response`, {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
        } as GenerateResponseRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Couldn't generate response: ${error}`);
      }

      const data = (await response.json()) as {
        response: string;
      };

      return data.response;
    },
  });
};

export const useRegenerateResponseMutation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      }),
    mutationFn: async (messageIndex: number) => {
      const response = await fetch(
        `/api/chat_completions/regenerate_response`,
        {
          method: "POST",
          body: JSON.stringify({
            conversation_id: conversationId,
            message_index: messageIndex,
          } as RegenerateResponseRequestBody),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Couldn't generate response: ${error}`);
      }

      const data = (await response.json()) as {
        response: string;
      };

      return data.response;
    },
  });
};
