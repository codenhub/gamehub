export const VALID_THEMES = ["dark", "light"] as const;
export type Theme = (typeof VALID_THEMES)[number];

export const THEMES: Record<Theme, Record<string, string>> = {
  light: {
    "--color-primary": "var(--color-neutral-950)",
    "--color-primary-contrast": "var(--color-neutral-50)",
    "--color-primary-hover": "var(--color-neutral-700)",
    "--color-accent": "var(--color-neutral-300)",
    "--color-accent-contrast": "var(--color-neutral-950)",
    "--color-accent-hover": "var(--color-neutral-400)",
    "--color-border": "var(--color-neutral-300)",
    "--color-background": "var(--color-neutral-50)",
    "--color-foreground": "var(--color-neutral-100)",
    "--color-text": "var(--color-neutral-950)",
    "--color-text-secondary": "var(--color-neutral-700)",
  },
  dark: {
    "--color-primary": "var(--color-neutral-50)",
    "--color-primary-contrast": "var(--color-neutral-950)",
    "--color-primary-hover": "var(--color-neutral-300)",
    "--color-accent": "var(--color-neutral-300)",
    "--color-accent-contrast": "var(--color-neutral-950)",
    "--color-accent-hover": "var(--color-neutral-400)",
    "--color-border": "var(--color-neutral-600)",
    "--color-background": "var(--color-neutral-900)",
    "--color-foreground": "var(--color-neutral-800)",
    "--color-text": "var(--color-neutral-50)",
    "--color-text-secondary": "var(--color-neutral-200)",
  },
};

export const isValidTheme = (value: string | null): value is Theme =>
  value !== null && VALID_THEMES.includes(value as Theme);

export const getTheme = (): Theme => {
  const storedTheme = localStorage.getItem("theme");
  if (isValidTheme(storedTheme)) return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const setTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);

  const t = THEMES[theme];

  (Object.keys(t) as Array<keyof typeof t>).forEach((k) => {
    document.documentElement.style.setProperty(k, t[k]);
  });

  // Dispatch event so games can react to theme changes
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
};

export const initTheme = () => {
  setTheme(getTheme());
};

export const getThemeColor = (variable: string) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};
