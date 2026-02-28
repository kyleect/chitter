import { IconCode, IconCodeOff } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const IfEqIcon: FC<Props> = ({ color }) => {
  return <IconCode stroke={1.5} color={color} />;
};

export const EndIfIcon: FC<Props> = ({ color }) => {
  return <IconCodeOff stroke={1.5} color={color} />;
};
