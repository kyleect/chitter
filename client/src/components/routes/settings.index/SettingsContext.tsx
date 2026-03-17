import { StatePair } from "@/lib/statePair";
import { createContext, useContext } from "react";
import { AppSettings } from "server-types";

type ContextType = {
  state: StatePair<AppSettings | null>;
};

export const SettingsContext = createContext<ContextType | null>(null);

export const useSettingsContext = () => {
  return useContext(SettingsContext);
};
