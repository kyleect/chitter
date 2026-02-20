import { TemplateBlock } from "@/components/routes/templates.$templateId/TemplateBlock";
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
  Affix,
  Alert,
  Button,
  Card,
  Code,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Textarea,
  Transition,
} from "@mantine/core";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
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
import { useEffect, useState } from "react";
import {
  ConversationItem,
  ConversationTemplate,
  Message,
  VariableValue,
} from "server-types";
import { produce } from "immer";

export const Route = createFileRoute("/templates/$templateId")({
  component: RouteComponent,
});

type Unarray<T> = T extends Array<infer U> ? U : T;

const setDraftTemplateImmer =
  (set: React.Dispatch<React.SetStateAction<ConversationTemplate["items"]>>) =>
  (
    draftItemIndex: number,
    patchFn: (
      item: Partial<Unarray<ConversationTemplate["items"]>>,
      patch: Partial<Unarray<ConversationTemplate["items"]>>,
    ) => void,
    patch: Partial<Unarray<ConversationTemplate["items"]>>,
  ) => {
    set(
      produce((draftItems) => {
        const draftItem = draftItems[draftItemIndex];

        patchFn(draftItem, patch);
      }),
    );
  };

function RouteComponent() {
  const params = Route.useParams();
  const getTemplateByIdQuery = useGetTemplateByIdQuery(params.templateId);
  const [opened, { open, close }] = useDisclosure(false);
  const [scroll] = useWindowScroll();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState<
    ConversationTemplate["items"]
  >([]);

  useEffect(() => {
    setDraftTemplate(getTemplateByIdQuery.data?.items ?? []);
  }, [getTemplateByIdQuery.data]);

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

  if (!template || !draftTemplate) {
    return <Alert color="blue">Template not found</Alert>;
  }

  const patchItem = setDraftTemplateImmer(setDraftTemplate);

  const divider = (
    <Divider
      mt={0}
      label={
        <ActionIcon.Group>
          {isEditing && (
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
                <Menu.Item leftSection={<IconBrain />}>
                  Inner Thoughts
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <ActionIcon variant="subtle" color="gray" onClick={open}>
            <IconCodeDots stroke={1.5} />
          </ActionIcon>
        </ActionIcon.Group>
      }
    />
  );

  const buttons = (
    <Button.Group>
      {isEditing && (
        <>
          <Button onClick={() => setIsEditing(!isEditing)}>Save</Button>
          <Button
            variant="light"
            onClick={() => {
              setDraftTemplate(getTemplateByIdQuery.data.items);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </>
      )}

      {!isEditing && (
        <>
          <Button onClick={() => setIsEditing(!isEditing)}>Edit</Button>
        </>
      )}

      <Button variant="outline">Delete</Button>
    </Button.Group>
  );

  return (
    <>
      <Stack>
        <Card>
          <Group justify="space-between">
            <Button variant="gradient">Chat</Button>
            {buttons}
          </Group>
        </Card>

        <Divider label={"Template"} mt="md" mb="md"></Divider>

        <Stack gap="xs">
          {draftTemplate.map((item, index) => {
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
                  <TemplateBlock
                    icon={icon}
                    title={item.message.role.kind}
                    isEditing={isEditing}
                  >
                    {isEditing ? (
                      <Textarea
                        size="md"
                        minRows={1}
                        autosize
                        value={item.message.message ?? ""}
                        onChange={(e) => {
                          patchItem(
                            index,
                            (draftItem, patch) => {
                              if (
                                isMessageItem(
                                  draftItem as unknown as ConversationItem,
                                )
                              ) {
                                (
                                  draftItem as {
                                    message: Message;
                                  }
                                // prettier-ignore
                              ).message.message =
                                  // @ts-expect-error: TODO: Fix
                                  patch.message!.message;
                              }
                            },
                            {
                              // @ts-expect-error: patchItem doesn't recursively apply Partial<T> yet
                              message: {
                                message: e.target.value,
                              },
                            },
                          );
                        }}
                      />
                    ) : (
                      <Text>{item.message.message}</Text>
                    )}
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
                    isEditing={isEditing}
                  >
                    {isEditing ? (
                      <Textarea
                        size="md"
                        minRows={1}
                        autosize
                        value={item.oOC}
                        onChange={(e) => {
                          patchItem(
                            index,
                            (draft, patch) => {
                              Object.assign(draft, patch);
                            },
                            {
                              oOC: e.target.value,
                            },
                          );
                        }}
                      />
                    ) : (
                      <Text>{item.oOC}</Text>
                    )}
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
                    isEditing={isEditing}
                  >
                    {isEditing ? (
                      <Textarea
                        size="md"
                        minRows={1}
                        autosize
                        value={item.innerThoughts}
                        onChange={(e) => {
                          patchItem(
                            index,
                            (draft, patch) => {
                              Object.assign(draft, patch);
                            },
                            {
                              innerThoughts: e.target.value,
                            },
                          );
                        }}
                      />
                    ) : (
                      <Text>{item.innerThoughts}</Text>
                    )}
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
                    isEditing={isEditing}
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
                    isEditing={isEditing}
                  >
                    {isEditing ? (
                      <Textarea
                        size="md"
                        minRows={1}
                        autosize
                        value={`${key} = ${value}`}
                        onChange={(e) => {
                          let [draftKey, draftValue] = e.target.value
                            .split("=")
                            .map((x) => x.trim());
                          let draftVarValue: VariableValue | null = null;

                          if (draftVarValue === null) {
                            return;
                          }

                          const maybeNumberValue = parseInt(draftValue, 10);
                          const maybeBoolValue =
                            draftValue === "true" || draftValue === "false";

                          if (!Number.isNaN(maybeNumberValue)) {
                            draftVarValue = {
                              number: maybeNumberValue,
                            };

                            patchItem(
                              index,
                              (draft, patch) => {
                                Object.assign(draft, patch);
                              },
                              {
                                setVar: [draftKey, draftVarValue],
                              },
                            );
                          } else if (maybeBoolValue) {
                            draftVarValue = {
                              boolean: draftValue === "true",
                            };

                            patchItem(
                              index,
                              (draft, patch) => {
                                Object.assign(draft, patch);
                              },
                              {
                                setVar: [draftKey, draftVarValue],
                              },
                            );
                          } else {
                            draftVarValue = {
                              string: draftValue,
                            };

                            patchItem(
                              index,
                              (draft, patch) => {
                                Object.assign(draft, patch);
                              },
                              {
                                setVar: [draftKey, draftVarValue],
                              },
                            );
                          }
                        }}
                      />
                    ) : (
                      <Code block mt={0} mb={0}>
                        {key} = {JSON.stringify(value)}
                      </Code>
                    )}
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
                    isEditing={isEditing}
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

      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 100}>
          {(transitionStyles) => (
            <Card p="xs" style={transitionStyles}>
              {buttons}
            </Card>
          )}
        </Transition>
      </Affix>
    </>
  );
}
