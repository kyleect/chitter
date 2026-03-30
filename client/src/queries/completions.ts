import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CONSERVATION_KEYS } from "./conversations";
import {
  ChatCompletionRequestBody,
  ChatImpersonationCompletionRequestBody,
  CompletionRequestBody,
  Conversation,
  LLMParameters,
  RegenerateResponseRequestBody,
} from "server-types";
import { produce } from "immer";

export const COMPLETION_KEYS = {
  all: ["completions"] as const,
  completion: (key: string) => [...COMPLETION_KEYS.all, "completion", key],
  chat_completion: (conversation_id: string) => [
    ...COMPLETION_KEYS.all,
    "chat_completion",
    conversation_id,
  ],
  chat_impersonation: (conversation_id: string) => [
    ...COMPLETION_KEYS.all,
    "chat_impersonation",
    conversation_id,
  ],
  regeneration: (conversation_id: string) => [
    ...COMPLETION_KEYS.all,
    "regenerate",
    conversation_id,
  ],
} as const;

export const useCompletionMutation = (key: string) => {
  return useMutation({
    mutationKey: COMPLETION_KEYS.completion(key),
    mutationFn: async ({
      prompt,
      params,
    }: {
      prompt: string;
      params?: Partial<LLMParameters>;
    }) => {
      const response = await fetch(`/api/completions/text`, {
        method: "POST",
        body: JSON.stringify({
          prompt,
          settings: {
            ...params,
          },
        } as CompletionRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Couldn't generate completion: ${error}`);
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
    onMutate: async ({
      prompt,
      systemMessageAfterPrompt,
    }: {
      prompt: string;
      systemMessageAfterPrompt?: string;
    }) => {
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

          const messages = [
            ...old.messages,
            {
              kind: "Message",
              role: { kind: "user" },
              content: prompt,
            },
          ];

          if (systemMessageAfterPrompt) {
            messages.push({
              kind: "Message",
              role: { kind: "system" },
              content: systemMessageAfterPrompt,
            });
          }

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
    mutationFn: async ({
      prompt,
      systemMessageAfterPrompt,
    }: {
      prompt: string;
      systemMessageAfterPrompt?: string;
    }) => {
      const response = await fetch(`/api/completions/chat`, {
        method: "POST",
        body: JSON.stringify({
          prompt,
          system_message_after_prompt: systemMessageAfterPrompt,
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

export const useChatImpersonationCompletionMutation = (
  conversationId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    // When mutate is called:
    onMutate: async () => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      });
    },
    // Always refetch after error or success:
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      }),
    mutationFn: async () => {
      const response = await fetch(`/api/completions/chat/impersonate`, {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          settings: {
            temperature: 1.0,
          },
        } as ChatImpersonationCompletionRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(
          `Couldn't generate chat impersonation completion: ${error}`,
        );
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
    // When mutate is called:
    onMutate: async () => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      });
    },
    // Always refetch after error or success:
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.detail(conversationId),
      }),
    mutationFn: async () => {
      const response = await fetch(`/api/completions/chat/generate`, {
        method: "POST",
        body: JSON.stringify({
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
      const response = await fetch(`/api/completions/chat/regenerate`, {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          message_index: messageIndex,
          guidance_prompt: guidancePrompt ?? null,
        } as RegenerateResponseRequestBody),
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
