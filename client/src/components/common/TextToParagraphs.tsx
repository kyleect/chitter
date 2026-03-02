import { Text } from "@mantine/core";
import { FC } from "react";

export const TextToParagraphs: FC<{
  text?: string;
  textProps?: React.ComponentProps<typeof Text>;
  splitOn?: string;
}> = ({ text = "", textProps, splitOn = "\n" }) =>
  text
    .split(splitOn)
    .filter(Boolean)
    .map((paragraph) => (
      <Text m={0} size="md" {...textProps}>
        {paragraph}
      </Text>
    ));
