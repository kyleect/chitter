import { ActionIcon, Stack, Text } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { FC, useState } from "react";

export const TextToParagraphs: FC<{
  text?: string;
  textProps?: React.ComponentProps<typeof Text>;
  stackProps?: React.ComponentProps<typeof Stack>;
  splitOn?: string;
  paragraphClamp?: number;
}> = ({
  text = "",
  textProps,
  splitOn = "\n",
  paragraphClamp,
  stackProps = {
    gap: 10,
  },
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const texts = text.split(splitOn).filter(Boolean);

  const paragraphs = texts
    .slice(0, isExpanded ? undefined : paragraphClamp)
    .map((paragraph) => (
      <Text m={0} size="md" {...textProps}>
        {paragraph}
      </Text>
    ));

  const isClamped = texts.length > paragraphs.length || isExpanded;

  return (
    <Stack {...stackProps}>
      {paragraphs}
      {isClamped && (
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={() => {
            setIsExpanded((prev) => !prev);
          }}
        >
          <IconDots />
        </ActionIcon>
      )}
    </Stack>
  );
};
