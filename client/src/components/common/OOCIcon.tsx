import { IconCompass } from "@tabler/icons-react";
import { FC } from "react";

type Props = {
  color?: string;
};

export const OOCIcon: FC<Props> = ({ color }) => {
  return <IconCompass stroke={1.5} color={color} />;
};
