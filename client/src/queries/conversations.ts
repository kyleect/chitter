import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Conversation,
  ConversationItem,
  Message,
  VariableKey,
  VariableValue,
} from "server-types";

export const CONSERVATION_KEYS = {
  all: ["templates"] as const,
  detail: (id: string) => [...CONSERVATION_KEYS.all, id],
} as const;

export const useGetConservationsQuery = () =>
  useQuery({
    queryKey: CONSERVATION_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/conservations`);
      const data = (await response.json()) as Conversation[];

      return data;
    },
  });

export const useGetConservationByIdQuery = (id: string) =>
  useQuery({
    queryKey: CONSERVATION_KEYS.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/conservations`);
      const data = (await response.json()) as Conversation[];

      const template = data.find((item) => item.id === id);

      return template ?? null;
    },
  });

export const useStartConversationMutation = () =>
  useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/templates/${templateId}/chat`, {
        method: "POST",
      });
      const data = (await response.json()) as Conversation;

      return data ?? null;
    },
  });

export function isMessageItem(
  item: ConversationItem,
): item is { message: Message } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "message";
}

export function isOOCItem(item: ConversationItem): item is { oOC: string } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "oOC";
}

export function isInnerThoughtsItem(
  item: ConversationItem,
): item is { innerThoughts: string } {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "innerThoughts";
}

export function isSetVarItem(item: ConversationItem): item is {
  setVar: [VariableKey, VariableValue];
} {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "setVar";
}

export function isEndIf(item: ConversationItem): item is "endIf" {
  return item === "endIf";
}

export function isIfEqItem(item: ConversationItem): item is {
  ifEq: [VariableKey, VariableValue];
} {
  const keys = Object.keys(item);

  if (keys.length > 1) return false;

  const key = keys[0];

  return key === "ifEq";
}
