import {
  isEndIf,
  isIfEqItem,
  isInnerThoughtsItem,
  isMessageItem,
  isOOCItem,
  isSetVarItem,
  useGetTemplateByIdQuery,
} from "@/queries/templates";
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  CloseButton,
  Code,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrain,
  IconCode,
  IconCodeDots,
  IconCodeOff,
  IconCompass,
  IconCpu,
  IconMail,
  IconPlus,
  IconRobot,
  IconUser,
  IconVariablePlus,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/templates/$templateId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [opened, { open, close }] = useDisclosure(false);

  if (getTemplateByIdQuery.isLoading) {
    return <Loader />;
  }

  if (getTemplateByIdQuery.isError) {
    return (
      <Alert color="red">
        Failed to load template: {JSON.stringify(getTemplateByIdQuery.error)}
      </Alert>
    );
  }

  const template = getTemplateByIdQuery.data;

  if (!template) {
    return <Alert color="blue">Template not found</Alert>;
  }

  const divider = (
    <Divider
      mt={0}
      label={
        <ActionIcon.Group>
          <Menu shadow="md" width={200} position="right-start">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconPlus />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>New Template Block</Menu.Label>

              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item leftSection={<IconMail />}>
                    Message
                  </Menu.Sub.Item>
                </Menu.Sub.Target>

                <Menu.Sub.Dropdown>
                  <Menu.Item leftSection={<IconRobot />}>Assistant</Menu.Item>
                  <Menu.Item leftSection={<IconUser />}>User</Menu.Item>
                  <Menu.Item leftSection={<IconCpu />}>System</Menu.Item>
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Item leftSection={<IconVariablePlus />}>
                Set Variable
              </Menu.Item>
              <Menu.Item leftSection={<IconCode />}>If Equals</Menu.Item>
              <Menu.Item leftSection={<IconCompass />}>OOC</Menu.Item>
              <Menu.Item leftSection={<IconBrain />}>Inner Thoughts</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <ActionIcon variant="subtle" color="gray" onClick={open}>
            <IconCodeDots stroke={1.5} />
          </ActionIcon>
        </ActionIcon.Group>
      }
    />
  );

  return (
    <>
      <Stack>
        <Card>
          <Group justify="space-between">
            <Text mb={0}>{template.id}</Text>
            <Button.Group>
              <Button>Chat</Button>
              <Button>Edit</Button>
              <Button color="red">Delete</Button>
            </Button.Group>
          </Group>
        </Card>

        <Divider label={"Template"} mt="md" mb="xl"></Divider>

        <Stack gap="xs">
          {template.items.map((item) => {
            if (isMessageItem(item)) {
              let icon: React.ReactNode = null;

              switch (item.message.role.kind) {
                case "user":
                  icon = <IconUser stroke={1.5} />;
                  break;
                case "assistant":
                  icon = <IconRobot stroke={1.5} />;
                  break;
                case "system":
                  icon = <IconCpu stroke={1.5} />;
                  break;
              }

              return (
                <>
                  <TemplateBlock icon={icon} title={item.message.role.kind}>
                    <Text>{item.message.message}</Text>
                  </TemplateBlock>

                  {divider}
                </>
              );
            }

            if (isOOCItem(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconCompass stroke={1.5} />}
                    title="OOC"
                    level={1}
                  >
                    <Text>{item.oOC}</Text>
                  </TemplateBlock>

                  {divider}
                </>
              );
            }

            if (isInnerThoughtsItem(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconBrain stroke={1.5} />}
                    title="Inner Thoughts"
                    level={1}
                  >
                    <Text>{item.innerThoughts}</Text>
                  </TemplateBlock>

                  {divider}
                </>
              );
            }

            if (isSetVarItem(item)) {
              const key = item.setVar[0];
              // @ts-ignore
              const value =
                // @ts-ignore
                item.setVar[1]?.string ??
                // @ts-ignore
                item.setVar[1]?.number ??
                // @ts-ignore
                item.setVar[1]?.boolean;

              return (
                <>
                  <TemplateBlock
                    icon={<IconVariablePlus stroke={1.5} />}
                    title="Set Variable"
                    inline
                  >
                    <Code block mt={0} mb={0}>
                      {key} = {JSON.stringify(value)}
                    </Code>
                  </TemplateBlock>

                  {divider}
                </>
              );
            }

            if (isIfEqItem(item)) {
              const key = item.ifEq[0];
              // @ts-ignore
              const value =
                // @ts-ignore
                item.ifEq[1]?.string ??
                // @ts-ignore
                item.ifEq[1]?.number ??
                // @ts-ignore
                item.ifEq[1]?.boolean;

              return (
                <>
                  <TemplateBlock
                    icon={<IconCode stroke={1.5} />}
                    title="If Eq"
                    inline
                  >
                    <Code block mt={0} mb={0}>
                      {key} = {JSON.stringify(value)}
                    </Code>
                  </TemplateBlock>

                  {divider}
                </>
              );
            }

            if (isEndIf(item)) {
              return (
                <>
                  <TemplateBlock
                    icon={<IconCodeOff stroke={1.5} />}
                    title="End If"
                  />

                  {divider}
                </>
              );
            }

            return null;
          })}
        </Stack>
      </Stack>

      <Drawer
        position="bottom"
        opened={opened}
        onClose={close}
        title="Conversation State"
        size="lg"
      >
        {/* Drawer content */}
      </Drawer>
    </>
  );
}

type TemplateBlockProps = {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  inline?: boolean;
  level?: number;
};

const TemplateBlock: React.FC<TemplateBlockProps> = ({
  icon,
  title,
  inline,
  children,
  level = 0,
}) => {
  const levelFactor = 50;

  return inline ? (
    <Card withBorder shadow="xs" ml={level * levelFactor}>
      <Stack>
        <Group justify="space-between">
          <Group>
            <ThemeIcon variant="subtle">{icon}</ThemeIcon>
            <Text mb={0} fw="bold">
              {title}
            </Text>
          </Group>

          <Group>
            {children}
            <CloseButton />
          </Group>
        </Group>
      </Stack>
    </Card>
  ) : (
    <Card withBorder shadow="xs" ml={level * levelFactor}>
      <Stack>
        <Group justify="space-between">
          <Group>
            <ThemeIcon variant="subtle">{icon}</ThemeIcon>
            <Text mb={0} fw="bold">
              {title}
            </Text>
          </Group>

          <CloseButton />
        </Group>

        {children}
      </Stack>
    </Card>
  );
};
