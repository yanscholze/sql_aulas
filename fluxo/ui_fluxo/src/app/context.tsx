import { createContext, useContext } from "react";
import type { EditorSpec } from "../features/forms";
export const AppContext = createContext<{
  edit: (spec: EditorSpec) => void;
  notify: (message: string) => void;
  theme: string;
  setTheme: (value: string) => void;
}>({ edit: () => {}, notify: () => {}, theme: "light", setTheme: () => {} });
export const useApp = () => useContext(AppContext);
