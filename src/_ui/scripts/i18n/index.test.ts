import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../_core/storage", () => ({
  createStore: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

import { createI18n, isValidLocale, findLocale, LOCALES_ID, VALID_LOCALES, DEFAULT_LOCALE } from "./index";

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

describe("I18n class", () => {
  beforeEach(() => {
    global.document = {
      querySelectorAll: vi.fn().mockReturnValue([]),
      body: {},
    } as any;
    global.MutationObserver = class {
      observe = vi.fn();
      disconnect = vi.fn();
    } as any;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "test.key": "Translated {{param}}!",
        "missing.param": "Translated {{year}}.",
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize correctly", async () => {
    const instance = createI18n();
    expect(instance.getIsReady()).toBe(false);
    expect(instance.getLocale()).toBe(DEFAULT_LOCALE);

    await instance.init();
    expect(instance.getIsReady()).toBe(true);
  });

  it("should format string with interpolation", async () => {
    const instance = createI18n();
    await instance.init();
    expect(instance.t("test.key", { param: "value" })).toBe("Translated value!");
  });

  it("should fallback to generic year interpolation", async () => {
    const instance = createI18n();
    await instance.init();
    const currentYear = new Date().getFullYear().toString();
    expect(instance.t("missing.param")).toBe(`Translated ${currentYear}.`);
  });

  it("should return the key if translation is missing", async () => {
    const instance = createI18n();
    await instance.init();
    expect(instance.t("non.existent.key")).toBe("non.existent.key");
  });
});
