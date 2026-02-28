import { IconRobot, IconRobotOff } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const AssistantIcon: FC<Props> = ({ color }) => {
  return <IconRobot stroke={1.5} color={color} />;
};

export const AssistantMissingIcon: FC<Props> = ({ color }) => {
  return <IconRobotOff stroke={1.5} color={color} />;
};
