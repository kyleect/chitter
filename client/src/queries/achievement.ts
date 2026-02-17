import { useQuery } from "@tanstack/react-query";
import { AchievementDto } from "server-types";

export const ACHIEVEMENT_KEYS = {
  all: ["achievements"] as const,
} as const;

export const useGetAchievementsQuery = () =>
  useQuery({
    queryKey: ACHIEVEMENT_KEYS.all,
    queryFn: async () => {
      const response = await fetch(`/api/achievements`);
      const data = (await response.json()) as AchievementDto[];

      return data;
    },
  });
