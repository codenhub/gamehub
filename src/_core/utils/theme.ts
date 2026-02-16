export const VALID_THEMES = ["dark", "light"] as const;
export type Theme = (typeof VALID_THEMES)[number];

export const THEME_VARIABLES = [
  "--color-primary",
  "--color-primary-contrast",
  "--color-primary-hover",
  "--color-accent",
  "--color-accent-contrast",
  "--color-accent-hover",
  "--color-border",
  "--color-background",
  "--color-foreground",
  "--color-text",
  "--color-text-secondary",
  "--color-success",
  "--color-success-contrast",
  "--color-error",
  "--color-error-contrast",
  "--color-warning",
  "--color-warning-contrast",
  "--color-info",
  "--color-info-contrast",
] as const;

export type ThemeVariable = (typeof THEME_VARIABLES)[number];

export const THEMES: Record<Theme, Partial<Record<ThemeVariable, string>>> = {
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
    "--color-accent": "var(--color-neutral-500)",
    "--color-accent-contrast": "var(--color-neutral-950)",
    "--color-accent-hover": "var(--color-neutral-400)",
    "--color-border": "var(--color-neutral-600)",
    "--color-background": "var(--color-neutral-900)",
    "--color-foreground": "var(--color-neutral-800)",
    "--color-text": "var(--color-neutral-50)",
    "--color-text-secondary": "var(--color-neutral-200)",
  },
};

class ThemeManager {
  private currentTheme: Theme;

  constructor() {
    this.currentTheme = this.getStoredTheme();
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem("theme");
    if (this.isValidTheme(stored)) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  private isValidTheme(value: string | null): value is Theme {
    return (
      value !== null && (VALID_THEMES as readonly string[]).includes(value)
    );
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    const variables = THEMES[theme];

    (Object.keys(variables) as ThemeVariable[]).forEach((k) => {
      const val = variables[k];
      if (val) {
        document.documentElement.style.setProperty(k, val);
      }
    });

    window.dispatchEvent(
      new CustomEvent("theme-changed", { detail: { theme } }),
    );
  }

  public init() {
    this.setTheme(this.currentTheme);
  }

  public getColor(variable: ThemeVariable): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }
}

const THEME_MANAGER_KEY = "__THEME_MANAGER__" as const;

function getThemeManagerInstance(): ThemeManager {
  const global = globalThis as Record<string, unknown>;

  if (!global[THEME_MANAGER_KEY]) {
    global[THEME_MANAGER_KEY] = new ThemeManager();
  }

  return global[THEME_MANAGER_KEY] as ThemeManager;
}

export default getThemeManagerInstance();
