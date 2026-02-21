import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NewPersona, Persona } from "server-types";

export const PERSONA_KEYS = {
  all: ["personas"] as const,
  detail: (id: string) => [...PERSONA_KEYS.all, id],
} as const;

export const useGetPersonasQuery = () =>
  useQuery({
    queryKey: PERSONA_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/personas`);
      const data = (await response.json()) as Persona[];

      return data;
    },
  });

export const useGetPersonaByIdQuery = (id: string) =>
  useQuery({
    queryKey: PERSONA_KEYS.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/personas`);
      const data = (await response.json()) as Persona[];

      const persona = data.find((item) => item.id === id);

      return persona ?? null;
    },
  });

export const useCreatePersonaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPerson: NewPersona) => {
      const response = await fetch(`/api/personas`, {
        method: "POST",
        body: JSON.stringify(newPerson),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as Persona;

      return data;
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: PERSONA_KEYS.all,
      });
    },
  });
};
