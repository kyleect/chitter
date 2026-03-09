import {
  Card,
  Stack,
  Group,
  ThemeIcon,
  CloseButton,
  Text,
  Textarea,
  Code,
  Select,
} from "@mantine/core";
import { FC, useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { OOCIcon } from "@/components/common/OOCIcon";
import {
  usePatchIfEqMessage,
  usePatchInnerThoughtsMessage,
  usePatchMessageItem,
  usePatchOOCMessage,
  usePatchSetVarMessage,
  usePatchTemplateItem,
} from "@/hooks/usePatchTemplateItems";
import { InnerThoughtsIcon } from "@/components/common/InnerThoughtsIcon";
import { Message, VariableValue } from "server-types";
import { SetVarIcon } from "@/components/common/SetVarIcon";
import { EndIfIcon, IfEqIcon } from "@/components/common/IfEqIcon";
import { UserIcon } from "@/components/common/UserIcon";
import { AssistantIcon } from "@/components/common/AssistantIcon";
import { SystemIcon } from "@/components/common/SystemIcon";
import { isMessageItem } from "@/queries/conversations";
import { TextToParagraphs } from "@/components/common/TextToParagraphs";

type TemplateBlockProps = {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: React.ReactNode;
  inline?: boolean;
  level?: number;
  onClose?: () => void;
};

export const TemplateBlock: React.FC<TemplateBlockProps> = ({
  icon,
  title,
  inline,
  children,
  level = 0,
  onClose,
}) => {
  const context = useContext(TemplateContext)!;

  const { isEditingState } = context;
  const [isEditing] = isEditingState;

  const levelFactor = 50;

  return inline && !isEditing ? (
    <Card withBorder shadow="xs" p="xs" ml={level * levelFactor}>
      <Stack>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="subtle">{icon}</ThemeIcon>
            <Text mb={0} fw="bold">
              {title}
            </Text>
          </Group>

          <Group>
            {children}
            <CloseButton
              style={{
                visibility: isEditing ? undefined : "hidden",
              }}
              onClick={() => onClose?.call(null)}
            />
          </Group>
        </Group>
      </Stack>
    </Card>
  ) : (
    <Card withBorder shadow="xs" p="xs" ml={level * levelFactor}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="subtle">{icon}</ThemeIcon>
            <Text mb={0} fw="bold">
              {title}
            </Text>
          </Group>

          <CloseButton
            style={{
              visibility: isEditing ? undefined : "hidden",
            }}
            onClick={() => onClose?.call(null)}
          />
        </Group>

        {children}
      </Stack>
    </Card>
  );
};

type OOCTemplateBlockProps = {
  index: number;
  item: {
    oOC: string;
  };
  handleDeleteAtIndex: () => void;
};

export const OOCTemplateBlock: FC<OOCTemplateBlockProps> = ({
  index,
  item,
  handleDeleteAtIndex,
}) => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const patchOOCMessage = usePatchOOCMessage();

  return (
    <TemplateBlock
      icon={<OOCIcon />}
      title="OOC"
      level={1}
      onClose={handleDeleteAtIndex}
    >
      {isEditing ? (
        <Textarea
          size="md"
          minRows={1}
          autosize
          value={item.oOC}
          onChange={(e) => patchOOCMessage(index, e.target.value)}
        />
      ) : (
        <Text>{item.oOC}</Text>
      )}
    </TemplateBlock>
  );
};

type InnerThoughtsTemplateBlockProps = {
  index: number;
  item: {
    innerThoughts: string;
  };
  handleDeleteAtIndex: () => void;
};

export const InnerThoughtsTemplateBlock: FC<
  InnerThoughtsTemplateBlockProps
> = ({ index, item, handleDeleteAtIndex }) => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const patchInnerThoughtsMessage = usePatchInnerThoughtsMessage();

  return (
    <TemplateBlock
      icon={<InnerThoughtsIcon />}
      title="Inner Thoughts"
      level={1}
      onClose={handleDeleteAtIndex}
    >
      {isEditing ? (
        <Textarea
          size="md"
          minRows={1}
          autosize
          value={item.innerThoughts}
          onChange={(e) => patchInnerThoughtsMessage(index, e.target.value)}
        />
      ) : (
        <Text>{item.innerThoughts}</Text>
      )}
    </TemplateBlock>
  );
};

type SetVarTemplateBlockProps = {
  index: number;
  item: {
    setVar: [string, VariableValue];
  };
  handleDeleteAtIndex: () => void;
};

export const SetVarTemplateBlock: FC<SetVarTemplateBlockProps> = ({
  index,
  item,
  handleDeleteAtIndex,
}) => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const patchSetVarMessage = usePatchSetVarMessage();

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
    <TemplateBlock
      icon={<SetVarIcon />}
      title="Set Variable"
      inline
      onClose={handleDeleteAtIndex}
    >
      {isEditing ? (
        <Textarea
          size="md"
          minRows={1}
          autosize
          value={`${key} = ${value}`}
          onChange={(e) => patchSetVarMessage(index, e.target.value)}
        />
      ) : (
        <Code block mt={0} mb={0}>
          {key} = {JSON.stringify(value)}
        </Code>
      )}
    </TemplateBlock>
  );
};

type IfEqTemplateBlockProps = {
  index: number;
  item: {
    ifEq: [string, VariableValue];
  };
  handleDeleteAtIndex: () => void;
};

export const IfEqTemplateBlock: FC<IfEqTemplateBlockProps> = ({
  index,
  item,
  handleDeleteAtIndex,
}) => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const patchIfEqMessage = usePatchIfEqMessage();

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
    <TemplateBlock
      icon={<IfEqIcon />}
      title="If Eq"
      inline
      onClose={handleDeleteAtIndex}
    >
      {isEditing ? (
        <Textarea
          size="md"
          minRows={1}
          autosize
          value={`${key} = ${value}`}
          onChange={(e) => patchIfEqMessage(index, e.target.value)}
        />
      ) : (
        <Code block mt={0} mb={0}>
          {key} = {JSON.stringify(value)}
        </Code>
      )}
    </TemplateBlock>
  );
};

type EndIfTemplateBlockProps = {
  handleDeleteAtIndex: () => void;
};

export const EndIfTemplateBlock: FC<EndIfTemplateBlockProps> = ({
  handleDeleteAtIndex,
}) => {
  return (
    <TemplateBlock
      icon={<EndIfIcon />}
      title="End If"
      onClose={handleDeleteAtIndex}
    />
  );
};

type MessageTemplateBlockProps = {
  index: number;
  item: {
    message: Message;
  };
  handleDeleteAtIndex: () => void;
};

export const MessageTemplateBlock: FC<MessageTemplateBlockProps> = ({
  index,
  item,
  handleDeleteAtIndex,
}) => {
  const context = useContext(TemplateContext)!;
  const [isEditing] = context.isEditingState;
  const patchItem = usePatchTemplateItem();
  const patchMessageItem = usePatchMessageItem();

  let icon: React.ReactNode = null;

  switch (item.message.role.kind) {
    case "user":
      icon = <UserIcon />;
      break;
    case "assistant":
      icon = <AssistantIcon />;
      break;
    case "system":
      icon = <SystemIcon color="violet" />;
      break;
  }

  return (
    <TemplateBlock
      icon={icon}
      title={
        isEditing ? (
          <Select
            size="md"
            value={item.message.role.kind}
            onChange={(newRole) => {
              if (newRole === null) return;

              if (
                newRole !== "user" &&
                newRole !== "system" &&
                newRole !== "assistant"
              ) {
                return;
              }

              patchItem(
                index,
                (draft, patch) => {
                  if (
                    isMessageItem(draft as any) &&
                    isMessageItem(patch as any)
                  ) {
                    // @ts-expect-error TODO
                    draft.message.role.kind = patch.message.role.kind;
                  }
                },
                {
                  message: {
                    role: {
                      kind: newRole,
                    },
                  },
                },
              );
            }}
            data={["user", "system", "assistant"] as const}
          />
        ) : (
          <Text
            fw="bold"
            style={{
              textTransform: "capitalize",
            }}
          >
            {item.message.role.kind}
          </Text>
        )
      }
      onClose={handleDeleteAtIndex}
    >
      {isEditing ? (
        <Textarea
          size="md"
          minRows={1}
          autosize
          value={item.message.message ?? ""}
          onChange={(e) => patchMessageItem(index, e.target.value)}
        />
      ) : (
        <TextToParagraphs text={item.message.message ?? undefined} />
      )}
    </TemplateBlock>
  );
};
