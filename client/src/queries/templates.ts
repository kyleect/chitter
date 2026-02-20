import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ConversationItem,
  ConversationTemplate,
  Message,
  VariableKey,
  VariableValue,
} from "server-types";

export const TEMPLATE_KEYS = {
  all: ["templates"] as const,
  detail: (id: string) => [...TEMPLATE_KEYS.all, id],
} as const;

export const useGetTemplatesQuery = () =>
  useQuery({
    queryKey: TEMPLATE_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/templates`);
      const data = (await response.json()) as ConversationTemplate[];

      return data;
    },
  });

export const useGetTemplateByIdQuery = (id: string) =>
  useQuery({
    queryKey: TEMPLATE_KEYS.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/templates/${id}`);
      const data = (await response.json()) as ConversationTemplate;

      return data ?? null;
    },
  });

export const useUpdateTemplateByIdMutation = () =>
  useMutation({
    mutationFn: async (template: ConversationTemplate) => {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        body: JSON.stringify(template),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as ConversationTemplate;

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
