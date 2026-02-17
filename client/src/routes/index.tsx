import { useGetDebugInfoQuery } from "@/queries/debug";
import { Alert, Card, Code, Group, Loader, Stack } from "@mantine/core";
import { IconDatabaseExclamation, IconFolder } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const debugInfoQuery = useGetDebugInfoQuery();

  if (debugInfoQuery.isError) {
    return <Alert color="red">Error: {debugInfoQuery.error.message}</Alert>;
  }

  if (debugInfoQuery.isPending) {
    return <Loader />;
  }

  const isNotDbEncrypted = !debugInfoQuery.data.db_is_encrypted;

  return (
    <Stack gap="xs" data-testid="home-view">
      {isNotDbEncrypted && (
        <Alert
          color="orange"
          title="Database Is Not Encrypted"
          icon={<IconDatabaseExclamation />}
          mb="lg"
        >
          Secrets will be stored in plain text!
        </Alert>
      )}

      <Card>
        <Group>
          <IconFolder />
          <Code
            m={0}
            data-testid="project-cwd"
            style={{
              cursor: "default",
            }}
          >
            {debugInfoQuery.data.cwd}
          </Code>
        </Group>
      </Card>
    </Stack>
  );
}
