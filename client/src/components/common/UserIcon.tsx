import { IconUser, IconUserOff } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const UserIcon: FC<Props> = ({ color }) => {
  return <IconUser stroke={1.5} color={color} />;
};

export const UserMissingIcon: FC<Props> = ({ color }) => {
  return <IconUserOff stroke={1.5} color={color} />;
};
