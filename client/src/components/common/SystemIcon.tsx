import { IconCpu } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const SystemIcon: FC<Props> = ({ color }) => {
  return <IconCpu stroke={1.5} color={color} />;
};
