import { Text } from "@mantine/core";
import { FC } from "react";

export const AuthorName: FC<{
  name: string;
}> = ({ name }) => {
  return (
    <Text
      fw="bold"
      style={{
        textTransform: "capitalize",
      }}
    >
      {name}
    </Text>
  );
};
