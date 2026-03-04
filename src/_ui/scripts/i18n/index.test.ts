import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../_core/storage", () => ({
  createStore: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

import {
  createI18n,
  isValidLocale,
  findLocale,
  LOCALES_ID,
  VALID_LOCALES,
  DEFAULT_LOCALE,
  isValidI18nKey,
  parseI18nValue,
  resolveI18nValue,
} from "./index";

describe("isValidI18nKey", () => {
  it("should accept valid dot-notation keys", () => {
    expect(isValidI18nKey("main.sub.label")).toBe(true);
    expect(isValidI18nKey("game.2048.title")).toBe(true);
    expect(isValidI18nKey("app")).toBe(true);
  });

  it("should reject invalid i18n keys", () => {
    expect(isValidI18nKey("Some value")).toBe(false);
    expect(isValidI18nKey("main..label")).toBe(false);
    expect(isValidI18nKey("main.sub.")).toBe(false);
    expect(isValidI18nKey("main.sub-label")).toBe(false);
  });
});

describe("parseI18nValue", () => {
  it("should parse plain key values", () => {
    expect(parseI18nValue("main.sub.label")).toEqual({
      key: "main.sub.label",
      fallback: null,
    });
  });

  it("should parse key with inline fallback using first equals", () => {
    expect(parseI18nValue("main.sub.label=fallback=value")).toEqual({
      key: "main.sub.label",
      fallback: "fallback=value",
    });
  });

  it("should return null when value format is invalid", () => {
    expect(parseI18nValue("Some value")).toBeNull();
  });
});

describe("resolveI18nValue", () => {
  it("should resolve from current locale first", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback")!;

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => "Current",
        getDefault: () => "Default",
      }),
    ).toBe("Current");
  });

  it("should fallback to default locale", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback")!;

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => undefined,
        getDefault: () => "Default",
      }),
    ).toBe("Default");
  });

  it("should fallback to inline fallback when key is missing", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback")!;

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => undefined,
        getDefault: () => undefined,
      }),
    ).toBe("Fallback");
  });

  it("should fallback to key when plain key is missing", () => {
    const parsed = parseI18nValue("main.sub.label")!;

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => undefined,
        getDefault: () => undefined,
      }),
    ).toBe("main.sub.label");
  });
});

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
    vi.stubGlobal("navigator", undefined);
    global.document = {
      querySelectorAll: vi.fn().mockReturnValue([]),
      documentElement: {
        lang: "",
        matches: vi.fn().mockReturnValue(false),
        querySelectorAll: vi.fn().mockReturnValue([]),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        hasAttribute: vi.fn().mockReturnValue(false),
      },
      body: {
        querySelectorAll: vi.fn().mockReturnValue([]),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        hasAttribute: vi.fn().mockReturnValue(false),
      },
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
        "both.params": "Translated {{param}} in {{year}}!",
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

  it("should format string with both parameter and year interpolation", async () => {
    const instance = createI18n();
    await instance.init();
    const currentYear = new Date().getFullYear().toString();
    expect(instance.t("both.params", { param: "value" })).toBe(`Translated value in ${currentYear}!`);
  });

  it("should allow locale change subscriptions with unsubscribe", async () => {
    const instance = createI18n();
    await instance.init();

    const callback = vi.fn();
    const unsubscribe = instance.onLocaleChange(callback);

    await instance.setLocale("pt-BR");
    expect(callback).toHaveBeenCalledWith("pt-BR");

    unsubscribe();
    await instance.setLocale("en-US");

    expect(callback).toHaveBeenCalledTimes(1);
  });

  describe("Browser Locale Detection", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetModules();
    });

    it("should initialize with default locale if navigator is undefined", async () => {
      vi.stubGlobal("navigator", undefined);
      const { createI18n } = await import("./index");
      const instance = createI18n();
      expect(instance.getLocale()).toBe(DEFAULT_LOCALE);
    });

    it("should use browser locale if exact match is found", async () => {
      vi.stubGlobal("navigator", { languages: ["pt-BR", "en-US"] });
      const { createI18n } = await import("./index");
      const instance = createI18n();
      expect(instance.getLocale()).toBe("pt-BR");
    });

    it("should use browser locale fallback if partial match is found", async () => {
      vi.stubGlobal("navigator", { languages: ["pt-PT", "fr"] });
      const { createI18n } = await import("./index");
      const instance = createI18n();
      expect(instance.getLocale()).toBe("pt-BR");
    });

    it("should fallback to default if no matches found", async () => {
      vi.stubGlobal("navigator", { languages: ["fr-FR", "es-ES"] });
      const { createI18n } = await import("./index");
      const instance = createI18n();
      expect(instance.getLocale()).toBe(DEFAULT_LOCALE);
    });
  });
});
