import { Unarray } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import {
  Conversation,
  ConversationItem,
  ConversationTemplate,
  Message,
  Persona,
  VariableKey,
  VariableValue,
} from "server-types";
import { PERSONA_KEYS } from "./personas";

export const TEMPLATE_KEYS = {
  all: ["templates"] as const,
  detail: (id: string | null) => [...TEMPLATE_KEYS.all, id ?? null],
  preview: (id: string, at?: number) => [
    ...TEMPLATE_KEYS.detail(id),
    "preview",
    "at",
    at ?? null,
  ],
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

export const useGetTemplateByIdQuery = (id: string | null) =>
  useQuery({
    queryKey: TEMPLATE_KEYS.detail(id),
    queryFn: async () => {
      if (id === null) return;

      const response = await fetch(`/api/templates/${id}`);
      const data = (await response.json()) as ConversationTemplate;

      return data ?? null;
    },
  });

export const useCreateTemplateMutation = () =>
  useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch(`/api/templates`, {
        method: "POST",
        body: JSON.stringify({
          title,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as ConversationTemplate;

      return data;
    },
  });

export const useGetTemplateByIdPreviewQuery = (id: string, at?: number) =>
  useQuery({
    queryKey: TEMPLATE_KEYS.preview(id, at),
    queryFn: async () => {
      const response = await fetch(
        at
          ? `/api/templates/${id}/preview?at=${at}`
          : `/api/templates/${id}/preview`,
      );
      const data = (await response.json()) as Conversation;

      return data ?? null;
    },
  });

export const useUpdateTemplateByIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: ConversationTemplate) => {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        body: JSON.stringify(template),
        headers: {
          "content-type": "application/json",
        },
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw Error(`Error updating template: ${responseBody}`);
      }

      const data = JSON.parse(responseBody) as ConversationTemplate;

      return data ?? null;
    },
    async onSuccess(_) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [TEMPLATE_KEYS.all],
        }),

        queryClient.invalidateQueries({
          queryKey: [PERSONA_KEYS.all],
        }),
      ]);
    },
  });
};

export function isPersonaId(persona: unknown): persona is {
  type: "Id";
  data: string;
} {
  if (typeof persona === "undefined") return false;
  if (persona === null) return false;

  const type = (persona as any)["type"];

  return typeof type !== "undefined" && type === "Id";
}

export function isEmbeddedPersona(persona: unknown): persona is {
  type: "Embedded";
  data: Persona;
} {
  if (typeof persona === "undefined") return false;
  if (persona === null) return false;

  const type = (persona as any)["type"];

  return typeof type !== "undefined" && type === "Embedded";
}

export function isMessageItem(
  item: RecursivePartial<ConversationItem>,
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

export const patchItemsImmer =
  (set: React.Dispatch<React.SetStateAction<ConversationTemplate["items"]>>) =>
  (patchFn: (items: ConversationTemplate["items"]) => void) => {
    set(
      produce((draftItems) => {
        patchFn(draftItems);
      }),
    );
  };

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

export const patchItemImmer =
  (set: React.Dispatch<React.SetStateAction<ConversationTemplate["items"]>>) =>
  (
    draftItemIndex: number,
    patchFn: (
      item: RecursivePartial<Unarray<ConversationTemplate["items"]>>,
      patch: RecursivePartial<Unarray<ConversationTemplate["items"]>>,
    ) => void,
    patch: RecursivePartial<Unarray<ConversationTemplate["items"]>>,
  ) => {
    set(
      produce((draftItems) => {
        const draftItem = draftItems[draftItemIndex];

        patchFn(draftItem, patch);
      }),
    );
  };

type PatchItemsPatchFn = (items: ConversationItem[]) => void;
type PatchItemsFn = (patchFn: PatchItemsPatchFn) => void;

export const patchItemsWithInsertAt =
  (patchItems: PatchItemsFn) => (index: number, newItem: ConversationItem) =>
    patchItems((items) => items.splice(index, 0, newItem));

export const useDeleteTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: ConversationTemplate["id"]) => {
      await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: TEMPLATE_KEYS.all,
      });
    },
  });
};
