import { useCallback, useState } from "react";
import {
  applyThemeToDocument,
  readStoredTheme,
  type Theme,
} from "./theme";

const THEME_STORAGE_KEY = "theme";

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  const toggleTheme = useCallback((): void => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyThemeToDocument(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
