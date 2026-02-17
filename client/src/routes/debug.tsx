import { WEBSOCKET_STATUS_COLORS, WEBSOCKET_STATUSES } from "@/constants";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import { useGetDebugInfoQuery } from "@/queries/debug";
import { Badge, Button, ButtonGroup, Stack, Table, Title } from "@mantine/core";
import { useClipboard, useNetwork, useOs } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/debug")({
  component: RouteComponent,
});

function RouteComponent() {
  const os = useOs();
  const network = useNetwork();
  const clipboard = useClipboard();
  const { readyState } = useServerWebSocket();

  const updateKeyValue = useMutation({
    mutationFn: async () => {
      await fetch(`/api/state`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      notifications.show({
        message: `State state successfully reset!`,
      });
    },
  });

  const debugInfoQuery = useGetDebugInfoQuery();

  if (debugInfoQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (debugInfoQuery.isError) {
    return <p>Error: {debugInfoQuery.error.message}</p>;
  }

  if (updateKeyValue.isPending) {
    return <p>Loading...</p>;
  }

  if (updateKeyValue.isError) {
    return <p>Error: {updateKeyValue.error.message}</p>;
  }

  const connectionStatus = WEBSOCKET_STATUSES[readyState];
  const connectionStatusColor = WEBSOCKET_STATUS_COLORS[readyState];

  const networkStatus = network.online ? "Online" : "Offline";
  const networkStatusColor = network.online ? "green" : "red";
  const dbIsEncrypted = debugInfoQuery.data.db_is_encrypted ? "Yes" : "No";

  const copyDiagnosticInfo = () =>
    clipboard.copy(
      JSON.stringify(
        { os, network, connectionStatus, ...debugInfoQuery.data },
        null,
        2,
      ),
    );

  return (
    <Stack data-testid="debug-view">
      <Title order={2}>Diagnostics</Title>
      <Table variant="vertical">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th>Operating System</Table.Th>
            <Table.Td>
              <pre>{os}</pre>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Database</Table.Th>
            <Table.Td>
              <pre>{debugInfoQuery.data.db}</pre>
            </Table.Td>
          </Table.Tr>
          <Table.Tr data-testid="database-is-encrypted">
            <Table.Th>Database Is Encrypted</Table.Th>
            <Table.Td>
              <pre>{dbIsEncrypted}</pre>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Current Directory</Table.Th>
            <Table.Td>
              <pre>{debugInfoQuery.data.cwd}</pre>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Git Commit</Table.Th>
            <Table.Td>
              <pre>{debugInfoQuery.data.commit}</pre>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Network Connection</Table.Th>
            <Table.Td>
              <Badge
                variant="dot"
                radius="sm"
                size="md"
                color={networkStatusColor}
              >
                {networkStatus}
              </Badge>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Socket Connection</Table.Th>
            <Table.Td>
              <Badge
                variant="dot"
                radius="sm"
                size="md"
                color={connectionStatusColor}
              >
                {connectionStatus}
              </Badge>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <ButtonGroup>
        <Button color="blue" onClick={copyDiagnosticInfo}>
          {clipboard.copied ? "Copied!" : "Copy Info"}
        </Button>
      </ButtonGroup>
    </Stack>
  );
}
