import { IconMessageReport } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const FirstMessageIcon: FC<Props> = ({ color }) => {
  return <IconMessageReport stroke={1.5} color={color} />;
};
