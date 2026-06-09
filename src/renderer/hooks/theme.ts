export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "theme";

export function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function applyInitialTheme(): Theme {
  const theme = readStoredTheme();
  applyThemeToDocument(theme);
  return theme;
}
