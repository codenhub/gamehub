import { describe, it, expect } from "vitest";
import { isValidLocale, findLocale, LOCALES_ID, VALID_LOCALES, DEFAULT_LOCALE } from "./index";

describe("isValidLocale", () => {
  it("should accept all valid locale IDs", () => {
    LOCALES_ID.forEach((id) => {
      expect(isValidLocale(id)).toBe(true);
    });
  });

  it("should reject null", () => {
    expect(isValidLocale(null)).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidLocale("")).toBe(false);
  });

  it("should reject unknown locale IDs", () => {
    expect(isValidLocale("fr-FR")).toBe(false);
    expect(isValidLocale("EN-US")).toBe(false);
    expect(isValidLocale("pt")).toBe(false);
  });

  it("should reject non-string types", () => {
    expect(isValidLocale(123)).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
    expect(isValidLocale({})).toBe(false);
  });
});

describe("findLocale", () => {
  it("should return locale data for valid IDs", () => {
    LOCALES_ID.forEach((id) => {
      const locale = findLocale(id);
      expect(locale).toBeDefined();
      expect(locale?.id).toBe(id);
    });
  });

  it("should return locale with all required fields", () => {
    LOCALES_ID.forEach((id) => {
      const locale = findLocale(id);
      expect(locale).toHaveProperty("id");
      expect(locale).toHaveProperty("name");
      expect(locale).toHaveProperty("path");
      expect(locale).toHaveProperty("icon");
    });
  });
});

describe("VALID_LOCALES completeness", () => {
  it("should define every locale listed in LOCALES_ID", () => {
    LOCALES_ID.forEach((id) => {
      const match = VALID_LOCALES.find((l) => l.id === id);
      expect(match, `Missing locale definition for "${id}"`).toBeDefined();
    });
  });

  it("should have a name for every locale", () => {
    VALID_LOCALES.forEach((locale) => {
      expect(locale.name.length, `Locale "${locale.id}" has empty name`).toBeGreaterThan(0);
    });
  });

  it("should have a path for every locale", () => {
    VALID_LOCALES.forEach((locale) => {
      expect(locale.path.length, `Locale "${locale.id}" has empty path`).toBeGreaterThan(0);
    });
  });

  it("should have an icon for every locale", () => {
    VALID_LOCALES.forEach((locale) => {
      expect(locale.icon.length, `Locale "${locale.id}" has empty icon`).toBeGreaterThan(0);
    });
  });

  it("should not contain duplicate locale IDs", () => {
    const unique = new Set(LOCALES_ID);
    expect(unique.size).toBe(LOCALES_ID.length);
  });
});

describe("DEFAULT_LOCALE", () => {
  it("should be a valid locale ID", () => {
    expect(isValidLocale(DEFAULT_LOCALE)).toBe(true);
  });

  it("should have a corresponding locale definition", () => {
    expect(findLocale(DEFAULT_LOCALE)).toBeDefined();
  });
});
