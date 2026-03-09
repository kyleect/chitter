import { useMutation, useQuery } from "@tanstack/react-query";

export const INSERTABLE_KEYS = {
  all: ["insertables"] as const,
} as const;

export const useGetInsertablesQuery = () =>
  useQuery({
    queryKey: INSERTABLE_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/insertables`);
      const data = (await response.json()) as [string, string][];

      return data;
    },
  });

export const useUpdateInsertablesMutation = () =>
  useMutation({
    mutationFn: async (insertables: [string, string][]) => {
      const response = await fetch(`/api/insertables`, {
        method: "PUT",
        body: JSON.stringify(insertables),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = (await response.json()) as [string, string][];

      return data;
    },
  });
