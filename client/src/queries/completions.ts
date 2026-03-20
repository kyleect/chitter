import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONSERVATION_KEYS } from "./conversations";
import {
  ChatCompletionRequestBody,
  CompletionRequestBody,
  Conversation,
  RegenerateResponseRequestBody,
} from "server-types";
import { produce } from "immer";

export const COMPLETION_KEYS = {
  all: ["completions"] as const,
  completion: () => [...COMPLETION_KEYS.all, "completion"],
  chat_completion: (conversation_id: string) => [
    ...COMPLETION_KEYS.all,
    "chat_completion",
    conversation_id,
  ],
  regeneration: (conversation_id: string) => [
    ...COMPLETION_KEYS.all,
    "regenerate",
    conversation_id,
  ],
} as const;

export const useCompletionMutation = () => {
  return useMutation({
    mutationKey: COMPLETION_KEYS.completion(),
    mutationFn: async (prompt: string) => {
      const response = await fetch(`/api/completions`, {
        method: "POST",
        body: JSON.stringify({
          prompt,
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

export const useChatCompletionMutation = (conversationId: string) => {
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
                content: prompt,
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
        } as ChatCompletionRequestBody),
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

export const useRegenerateResponseMutation = (conversationId: string) => {
  const queryClient = useQueryClient();
  const conversationQueryKey = CONSERVATION_KEYS.detail(conversationId);

  return useMutation({
    async onMutate() {
      await queryClient.cancelQueries({
        queryKey: conversationQueryKey,
      });

      const prev = queryClient.getQueryData<Conversation>(conversationQueryKey);

      queryClient.setQueryData(
        conversationQueryKey,
        produce(prev, (draft) => {
          draft?.messages.pop();
        }),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: conversationQueryKey,
      }),
    mutationKey: COMPLETION_KEYS.regeneration(conversationId),
    mutationFn: async ({
      messageIndex,
      guidancePrompt,
    }: {
      messageIndex: number;
      guidancePrompt?: string;
    }) => {
      const response = await fetch(
        `/api/chat_completions/regenerate_response`,
        {
          method: "POST",
          body: JSON.stringify({
            conversation_id: conversationId,
            message_index: messageIndex,
            guidance_prompt: guidancePrompt ?? null,
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
