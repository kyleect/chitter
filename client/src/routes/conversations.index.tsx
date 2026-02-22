import { useGetConservationsQuery } from "@/queries/conversations";
import { Alert, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/conversations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const getConversationsQuery = useGetConservationsQuery();

  if (getConversationsQuery.isLoading) {
    return <Loader />;
  }

  if (getConversationsQuery.isError) {
    return (
      <Alert color="red">
        There was an error loading conversations:{" "}
        {JSON.stringify(getConversationsQuery.error)}
      </Alert>
    );
  }

  return (
    <Stack>
      {getConversationsQuery.data?.map((conversation) => {
        return (
          <Card>
            <Group>
              <Text fw="bold" mb={0}>
                Conversation:
              </Text>
              <Link
                to="/conversations/$conversationId"
                params={{
                  conversationId: conversation.id,
                }}
              >
                {conversation.id}
              </Link>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
