import {
  useCreateTemplateMutation,
  useGetTemplatesQuery,
} from "@/queries/templates";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const templatesQuery = useGetTemplatesQuery();
  const [draftName, setDraftName] = useState("");
  const createTemplateMutation = useCreateTemplateMutation();
  const nav = Route.useNavigate();

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
                {template.title ?? template.id}
              </Link>
            </Group>
          </Card>
        );
      })}

      <Card>
        <Group>
          <TextInput
            flex={1}
            value={draftName}
            size="md"
            placeholder="Template Name"
            autoFocus
            onChange={(e) => setDraftName(e.target.value)}
          />

          <Button.Group>
            <Button
              onClick={() => {
                createTemplateMutation.mutate(draftName, {
                  onSuccess(data) {
                    nav({
                      to: "/templates/$templateId",
                      params: {
                        templateId: data.id,
                      },
                    });
                  },
                });
              }}
            >
              Add
            </Button>
          </Button.Group>
        </Group>
      </Card>
    </Stack>
  );
}
