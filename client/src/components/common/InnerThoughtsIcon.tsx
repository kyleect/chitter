import { IconBrain } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const InnerThoughtsIcon: FC<Props> = ({ color }) => {
  return <IconBrain stroke={1.5} color={color} />;
};
