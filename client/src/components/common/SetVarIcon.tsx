import { IconVariablePlus } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const SetVarIcon: FC<Props> = ({ color }) => {
  return <IconVariablePlus stroke={1.5} color={color} />;
};
