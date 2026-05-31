import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Conversation,
  ConversationTemplate,
  Message,
  StartConversationRequest,
  TemplateBlock,
  VariableKey,
  VariableValue,
} from "server-types";
import { TEMPLATE_KEYS } from "./templates";

export const CONSERVATION_KEYS = {
  all: ["conversations"] as const,
  detail: (id: string | null) => [...CONSERVATION_KEYS.all, id],
} as const;

export const useGetConservationsQuery = () =>
  useQuery({
    queryKey: CONSERVATION_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/conversations`);
      const data = (await response.json()) as Conversation[];

      return data;
    },
  });

export const useGetConservationByIdQuery = (id: string) =>
  useQuery({
    queryKey: CONSERVATION_KEYS.detail(id),
    queryFn: async () => {
      if (id === null) return;

      const response = await fetch(`/api/conversations`);
      const data = (await response.json()) as Conversation[];

      const template: Conversation | undefined = data.find(
        (item) => item.id === id,
      ) as Conversation | undefined;

      return template ?? null;
    },
  });

export const useStartConversationMutation = () =>
  useMutation({
    mutationFn: async ({
      templateId,
      variantId,
      promptValues = {},
      firstMessageIndex,
    }: {
      templateId: string;
      variantId?: string;
      promptValues?: Record<string, string>;
      firstMessageIndex?: number;
    }) => {
      const firstMessageIndexQuery =
        typeof firstMessageIndex !== "undefined"
          ? `firstMessageIndex=${firstMessageIndex}`
          : "";

      const response = await fetch(
        `/api/templates/${templateId}/chat?variantId=${variantId}&${firstMessageIndexQuery}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            promptValues,
          } as StartConversationRequest),
        },
      );
      const data = (await response.json()) as Conversation;

      return data ?? null;
    },
  });

export function isMessageItem(item: any): item is { message: Message } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "message";
}

export function isFirstMessageItem(item: any): item is "firstAssistantMessage" {
  return item === "firstAssistantMessage";
}

export function isOOCItem(item: TemplateBlock): item is { oOC: string } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "oOC";
}

export function isInnerThoughtsItem(
  item: TemplateBlock,
): item is { innerThoughts: string } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "innerThoughts";
}

export function isSetVarItem(item: TemplateBlock): item is {
  setVar: [VariableKey, VariableValue];
} {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "setVar";
}

export function isEndIf(item: TemplateBlock): item is "endIf" {
  return item === "endIf";
}

export function isIfEqItem(item: TemplateBlock): item is {
  ifEq: [VariableKey, VariableValue];
} {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "ifEq";
}

export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: Conversation["id"]) => {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: CONSERVATION_KEYS.all,
      });
    },
  });
};

export const useUpdateConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Conversation) => {
      const response = await fetch(`/api/conversations/${update.id}`, {
        method: "PUT",
        body: JSON.stringify(update),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as Conversation;

      return data;
    },
    onSettled(data) {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: CONSERVATION_KEYS.detail(data.id),
        });
      }
    },
  });
};

export const useForkConversationByIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      at,
    }: {
      conversationId: Conversation["id"];
      at?: number;
    }) => {
      let url = `/api/conversations/${conversationId}/fork`;

      if (at) {
        url = `${url}?at=${at}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw Error(`Error updating conversation: ${responseBody}`);
      }

      const data = JSON.parse(responseBody) as Conversation;

      return data ?? null;
    },
    async onSuccess(_) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [CONSERVATION_KEYS.all],
        }),
      ]);
    },
  });
};

export const useForkConversationAsTemplateByIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      at,
    }: {
      conversationId: Conversation["id"];
      at?: number;
    }) => {
      let url = `/api/conversations/${conversationId}/fork_as_template`;

      if (at) {
        url = `${url}?at=${at}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw Error(`Error forking conversation as template: ${responseBody}`);
      }

      const data = JSON.parse(responseBody) as ConversationTemplate;

      return data ?? null;
    },
    async onSuccess(_) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [TEMPLATE_KEYS.all],
        }),
      ]);
    },
  });
};
