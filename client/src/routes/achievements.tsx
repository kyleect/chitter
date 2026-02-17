import { DATE_FORMAT } from "@/constants";
import { useGetAchievementsQuery } from "@/queries/achievement";
import { Alert, Stack, Table, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";

export const Route = createFileRoute("/achievements")({
  component: RouteComponent,
});

function RouteComponent() {
  const achievementsQuery = useGetAchievementsQuery();

  if (achievementsQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (achievementsQuery.isError) {
    return <p>Error: {achievementsQuery.error.message}</p>;
  }

  let earnedAchievements = achievementsQuery.data.filter(
    (achievement) => achievement.is_earned
  );

  return (
    <Stack>
      <Title order={2}>🏆 Achievements</Title>

      {earnedAchievements.length === 0 ? (
        <Alert>No achievements earned yet.</Alert>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Earned?</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {earnedAchievements.map((achievement) => {
              return (
                <Table.Tr>
                  <Table.Td>{achievement.title}</Table.Td>
                  <Table.Td>{achievement.description}</Table.Td>
                  <Table.Td>
                    {achievement.is_earned
                      ? dayjs(achievement.earned_at).format(DATE_FORMAT)
                      : "Not Yet"}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
