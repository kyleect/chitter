import { useGetTemplatesQuery } from "@/queries/templates";
import { Alert, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const templatesQuery = useGetTemplatesQuery();

  if (templatesQuery.isLoading) {
    return <Loader />;
  }

  if (templatesQuery.isError) {
    return (
      <Alert color="red">
        Failed to load templates: {JSON.stringify(templatesQuery.error)}
      </Alert>
    );
  }

  return (
    <Stack>
      {templatesQuery.data?.map((template) => {
        return (
          <Card>
            <Group>
              <Text fw="bold" mb={0}>
                Template:
              </Text>

              <Link
                to={`/templates/$templateId`}
                params={{
                  templateId: template.id,
                }}
              >
                {template.id}
              </Link>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
