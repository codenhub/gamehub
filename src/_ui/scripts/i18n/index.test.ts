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

type LocalePayload = Record<string, string>;
type LocalePayloadById = {
  "en-US": LocalePayload;
  "pt-BR": LocalePayload;
};

const DEFAULT_PAYLOADS: LocalePayloadById = {
  "en-US": {
    "app.name": "GameHub",
    "test.key": "Translated {{param}}!",
    "missing.param": "Translated {{year}}.",
    "both.params": "Translated {{param}} in {{year}}!",
    "home.game.snake": "Snake",
    "footer.rightsReserved": "© {{year}} GameHub. All rights reserved.",
    "footer.madeWith": "Made with",
    "footer.by": "by",
    "outside.key": "Outside EN",
    "inside.key": "Inside EN",
  },
  "pt-BR": {
    "app.name": "GameHub",
    "test.key": "Traduzido {{param}}!",
    "missing.param": "Traduzido {{year}}.",
    "both.params": "Traduzido {{param}} em {{year}}!",
    "home.game.snake": "Cobrinha",
    "footer.rightsReserved": "© {{year}} GameHub. Todos os direitos reservados.",
    "footer.madeWith": "Feito com",
    "footer.by": "por",
    "outside.key": "Fora PT",
    "inside.key": "Dentro PT",
  },
};

class MockElement {
  public textContent: string;
  public parentElement: MockElement | null = null;
  public lang: string = "";

  private readonly attributes = new Map<string, string>();
  private readonly children: MockElement[] = [];
  private readonly elementTagName: string;

  constructor(tagName: string, textContent: string = "") {
    this.elementTagName = tagName.toUpperCase();
    this.textContent = textContent;
  }

  get tagName(): string {
    return this.elementTagName;
  }

  public appendChild(child: MockElement): void {
    child.parentElement = this;
    this.children.push(child);
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public matches(selectors: string): boolean {
    return selectors
      .split(",")
      .map((selector) => selector.trim())
      .some((selector) => this.matchesSelector(selector));
  }

  public querySelectorAll(selectors: string): MockElement[] {
    const found: MockElement[] = [];

    const walk = (node: MockElement) => {
      node.children.forEach((child) => {
        if (child.matches(selectors)) {
          found.push(child);
        }

        walk(child);
      });
    };

    walk(this);

    return found;
  }

  private matchesSelector(selector: string): boolean {
    if (selector === "[data-i18n]") {
      return this.attributes.has("data-i18n");
    }

    if (selector.startsWith("[data-i18n-") && selector.endsWith("]")) {
      const attributeName = selector.slice(1, -1);
      return this.attributes.has(attributeName);
    }

    return false;
  }
}

function createFetchMock(payloads: LocalePayloadById = DEFAULT_PAYLOADS) {
  return vi.fn(async (input: unknown) => {
    const path = String(input);
    const localeId = path.includes("pt-BR.json") ? "pt-BR" : path.includes("en-US.json") ? "en-US" : null;
    const data = localeId ? payloads[localeId] : null;

    if (!data) {
      return {
        ok: false,
        statusText: "Not Found",
        json: async () => ({}),
      };
    }

    return {
      ok: true,
      statusText: "OK",
      json: async () => data,
    };
  });
}

function createDocumentMock() {
  return {
    documentElement: {
      lang: "",
      matches: vi.fn().mockReturnValue(false),
      querySelectorAll: vi.fn().mockReturnValue([]),
      getAttribute: vi.fn().mockReturnValue(null),
      setAttribute: vi.fn(),
    },
  } as unknown as Document;
}

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
  it("should parse valid key=fallback tokens", () => {
    expect(parseI18nValue("main.sub.label=Fallback")).toEqual({
      type: "key",
      key: "main.sub.label",
      fallback: "Fallback",
    });
  });

  it("should return raw value when key format is invalid", () => {
    expect(parseI18nValue("main..label=Fallback")).toEqual({
      type: "raw",
      value: "main..label=Fallback",
    });
  });

  it("should return raw value for raw text without token separator", () => {
    expect(parseI18nValue("Snake game title")).toEqual({
      type: "raw",
      value: "Snake game title",
    });
  });

  it("should keep everything after first equals as fallback text", () => {
    expect(parseI18nValue("main.sub.label=fallback=value")).toEqual({
      type: "key",
      key: "main.sub.label",
      fallback: "fallback=value",
    });
  });
});

describe("resolveI18nValue", () => {
  it("should use current locale translation when key exists", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback");

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => "Current",
        getDefault: () => "Default",
      }),
    ).toBe("Current");
  });

  it("should use default locale translation when current locale is missing the key", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback");

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => undefined,
        getDefault: () => "Default",
      }),
    ).toBe("Default");
  });

  it("should use inline fallback when key is missing in both locales", () => {
    const parsed = parseI18nValue("main.sub.label=Fallback");

    expect(
      resolveI18nValue(parsed, {
        getCurrent: () => undefined,
        getDefault: () => undefined,
      }),
    ).toBe("Fallback");
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
      const match = VALID_LOCALES.find((locale) => locale.id === id);
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
    global.document = createDocumentMock();
    global.fetch = createFetchMock() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it("should translate regular DOM and skip custom element descendants", async () => {
    const root = new MockElement("html");
    const regularText = new MockElement("p", "Outside raw");
    const customElementHost = new MockElement("gh-header");
    const nestedText = new MockElement("span", "Inside raw");

    regularText.setAttribute("data-i18n", "outside.key");
    nestedText.setAttribute("data-i18n", "inside.key");

    customElementHost.appendChild(nestedText);
    root.appendChild(regularText);
    root.appendChild(customElementHost);

    global.document = {
      documentElement: root,
    } as unknown as Document;

    const instance = createI18n();
    await instance.init();

    expect(regularText.textContent).toBe("Outside EN");
    expect(nestedText.textContent).toBe("Inside raw");

    await instance.setLocale("pt-BR");

    expect(regularText.textContent).toBe("Fora PT");
    expect(nestedText.textContent).toBe("Inside raw");
  });

  it("should resolve header-like key=fallback tokens after locale changes", async () => {
    const instance = createI18n();

    await instance.init();

    expect(instance.resolve("home.game.snake=Snake")).toBe("Snake");

    await instance.setLocale("pt-BR");

    expect(instance.resolve("home.game.snake=Snake")).toBe("Cobrinha");
  });

  it("should resolve footer-like tokens after locale changes", async () => {
    const instance = createI18n();
    const currentYear = new Date().getFullYear().toString();

    await instance.init();

    expect(instance.resolve("footer.madeWith=Made with")).toBe("Made with");
    expect(instance.resolve("footer.by=by")).toBe("by");
    expect(instance.resolve("footer.rightsReserved=© {{year}} GameHub. All rights reserved.")).toBe(
      `© ${currentYear} GameHub. All rights reserved.`,
    );

    await instance.setLocale("pt-BR");

    expect(instance.resolve("footer.madeWith=Made with")).toBe("Feito com");
    expect(instance.resolve("footer.by=by")).toBe("por");
    expect(instance.resolve("footer.rightsReserved=© {{year}} GameHub. All rights reserved.")).toBe(
      `© ${currentYear} GameHub. Todos os direitos reservados.`,
    );
  });

  describe("Browser Locale Detection", () => {
    it("should initialize with default locale if navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      const instance = createI18n();

      expect(instance.getLocale()).toBe(DEFAULT_LOCALE);
    });

    it("should use browser locale if exact match is found", () => {
      vi.stubGlobal("navigator", { languages: ["pt-BR", "en-US"] });
      const instance = createI18n();

      expect(instance.getLocale()).toBe("pt-BR");
    });

    it("should use browser locale fallback if partial match is found", () => {
      vi.stubGlobal("navigator", { languages: ["pt-PT", "fr"] });
      const instance = createI18n();

      expect(instance.getLocale()).toBe("pt-BR");
    });

    it("should fallback to default if no matches found", () => {
      vi.stubGlobal("navigator", { languages: ["fr-FR", "es-ES"] });
      const instance = createI18n();

      expect(instance.getLocale()).toBe(DEFAULT_LOCALE);
    });
  });
});
