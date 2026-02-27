import { describe, it, expect } from "vitest";
import { isValidTheme, VALID_THEMES, THEME_VARIABLES, THEMES } from "./theme-data";

describe("isValidTheme", () => {
  it("should accept all valid themes", () => {
    VALID_THEMES.forEach((theme) => {
      expect(isValidTheme(theme)).toBe(true);
    });
  });

  it("should reject null", () => {
    expect(isValidTheme(null)).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidTheme("")).toBe(false);
  });

  it("should reject unknown theme names", () => {
    expect(isValidTheme("ocean")).toBe(false);
    expect(isValidTheme("neon")).toBe(false);
    expect(isValidTheme("DARK")).toBe(false);
  });
});

describe("THEMES completeness", () => {
  it("should define every theme listed in VALID_THEMES", () => {
    VALID_THEMES.forEach((theme) => {
      expect(THEMES).toHaveProperty(theme);
    });
  });

  it("should define all THEME_VARIABLES in every theme", () => {
    VALID_THEMES.forEach((theme) => {
      const variables = THEMES[theme];

      THEME_VARIABLES.forEach((variable) => {
        expect(variables[variable], `Theme "${theme}" is missing variable "${variable}"`).toBeDefined();
        expect(variables[variable].length, `Theme "${theme}" has empty variable "${variable}"`).toBeGreaterThan(0);
      });
    });
  });

  it("should only use valid CSS var() references as values", () => {
    const varPattern = /^var\(--color-[\w-]+\)$/;

    VALID_THEMES.forEach((theme) => {
      const variables = THEMES[theme];

      (Object.entries(variables) as [string, string][]).forEach(([key, value]) => {
        if (key === "--logo-filter") return;
        expect(varPattern.test(value), `Theme "${theme}", variable "${key}" has invalid value: "${value}"`).toBe(true);
      });
    });
  });
});

describe("VALID_THEMES", () => {
  it("should contain at least light and dark themes", () => {
    expect(VALID_THEMES).toContain("light");
    expect(VALID_THEMES).toContain("dark");
  });

  it("should not contain duplicates", () => {
    const unique = new Set(VALID_THEMES);
    expect(unique.size).toBe(VALID_THEMES.length);
  });
});
