export { VALID_THEMES, THEME_VARIABLES, THEMES, isValidTheme } from "./data";
export type { Theme, ThemeVariable } from "./data";

import { VALID_THEMES, THEME_VARIABLES, THEMES, isValidTheme } from "./data";
import type { Theme, ThemeVariable } from "./data";
import { createStore } from "../../../_core/storage";

type ThemeSchema = {
  theme: string;
};

const themeStore = createStore<ThemeSchema>("settings");

/**
 * Manages application themes, including persistence and applying CSS variables.
 */
class ThemeManager {
  private currentTheme: Theme;
  private isInitialized = false;

  constructor() {
    this.currentTheme = this.getStoredTheme();
  }

  private getStoredTheme(): Theme {
    const stored = themeStore.get("theme");
    if (isValidTheme(stored)) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;

    VALID_THEMES.forEach((t) => document.documentElement.classList.remove(`theme-${t}`));
    document.documentElement.classList.add(`theme-${theme}`);

    themeStore.set("theme", theme);

    // Clear all theme variables before applying new ones to avoid stale values
    THEME_VARIABLES.forEach((v) => document.documentElement.style.removeProperty(v));

    const variables = THEMES[theme];

    (Object.keys(variables) as ThemeVariable[]).forEach((k) => {
      const val = variables[k];
      if (val) {
        document.documentElement.style.setProperty(k, val);
      }
    });

    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
  }

  public init() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.setTheme(this.currentTheme);
  }

  public getColor(variable: ThemeVariable): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}

const themeManager = new ThemeManager();
export default themeManager;
