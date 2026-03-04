import { createStore } from "../../../_core/storage";

export type LocaleId = (typeof LOCALES_ID)[number];

export type Locale = {
  id: LocaleId;
  name: string;
  path: string;
  icon: string;
};

export const EVENT_LOCALE_CHANGED = "locale-changed";
const DEFAULT_LOCALE: LocaleId = "en-US";
const LOCALES_ID = ["en-US", "pt-BR"] as const;
const VALID_LOCALES: Locale[] = [
  {
    id: "en-US",
    name: "English",
    path: "/data/locales/en-US.json",
    icon: "/assets/icons/locales/en-US.webp",
  },
  {
    id: "pt-BR",
    name: "Português",
    path: "/data/locales/pt-BR.json",
    icon: "/assets/icons/locales/pt-BR.webp",
  },
];

export { LOCALES_ID, VALID_LOCALES, DEFAULT_LOCALE };

const DEFAULT_SELECTOR = "[data-i18n]" as const;
const TRANSLATABLE_ATTRIBUTES = ["title", "alt", "aria-label"] as const;
const I18N_KEY_PATTERN = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*$/;
const KEY_FALLBACK_SEPARATOR = "=";

type ParsedI18nKeyValue = {
  type: "key";
  key: string;
  fallback: string | null;
};

type ParsedRawI18nValue = {
  type: "raw";
  value: string;
};

export type ParsedI18nValue = ParsedI18nKeyValue | ParsedRawI18nValue;

type ResolveI18nValueOptions = {
  getCurrent: (key: string) => string | undefined;
  getDefault: (key: string) => string | undefined;
};

type LocaleChangedDetail = {
  locale: LocaleId;
};

type I18nSchema = {
  locale: LocaleId;
};

const i18nStore = createStore<I18nSchema>("settings");

function isCustomElementHost(element: Element): boolean {
  return element.tagName.includes("-");
}

function isInsideCustomElementTree(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    if (isCustomElementHost(current)) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

export function isValidI18nKey(value: string): boolean {
  return I18N_KEY_PATTERN.test(value);
}

export function parseI18nValue(value: string): ParsedI18nValue {
  const separatorIndex = value.indexOf(KEY_FALLBACK_SEPARATOR);
  const hasInlineFallback = separatorIndex >= 0;

  const key = hasInlineFallback ? value.slice(0, separatorIndex) : value;
  if (!isValidI18nKey(key)) {
    return {
      type: "raw",
      value,
    };
  }

  const fallback = hasInlineFallback ? value.slice(separatorIndex + 1) : null;

  return {
    type: "key",
    key,
    fallback,
  };
}

export function resolveI18nValue(parsed: ParsedI18nValue, options: ResolveI18nValueOptions): string {
  if (parsed.type === "raw") {
    return parsed.value;
  }

  return options.getCurrent(parsed.key) ?? options.getDefault(parsed.key) ?? parsed.fallback ?? parsed.key;
}

export function isValidLocale(value: unknown): value is LocaleId {
  return typeof value === "string" && (LOCALES_ID as readonly string[]).includes(value);
}

export function findLocale(id: LocaleId): Locale | undefined {
  return VALID_LOCALES.find((l) => l.id === id);
}

class I18n extends EventTarget {
  private currentLocale: LocaleId;
  private keys: Map<string, string> = new Map<string, string>();
  private fallbackKeys: Map<string, string> = new Map<string, string>();
  private cache: Map<LocaleId, Record<string, string>> = new Map();
  private isReady: boolean = false;

  constructor() {
    super();
    const persisted = i18nStore.get("locale");
    if (isValidLocale(persisted)) {
      this.currentLocale = persisted;
      return;
    }

    this.currentLocale = this.getBrowserLocale() || DEFAULT_LOCALE;
  }

  private getBrowserLocale(): LocaleId | null {
    if (typeof navigator === "undefined" || !navigator.languages) {
      return null;
    }

    for (const rawLang of navigator.languages) {
      if (!rawLang) continue;

      const lang = rawLang.toLowerCase();

      // Exact match (e.g., "en-us" -> "en-US")
      const exactMatch = LOCALES_ID.find((id) => id.toLowerCase() === lang);
      if (exactMatch) return exactMatch;

      // Partial match (e.g., "pt" -> "pt-BR")
      const baseLang = lang.split("-")[0];
      const partialMatch = LOCALES_ID.find((id) => id.toLowerCase().startsWith(baseLang));
      if (partialMatch) return partialMatch as LocaleId;
    }

    return null;
  }

  private async fetchLocaleData(locale: LocaleId): Promise<Record<string, string>> {
    const path = findLocale(locale)?.path;
    if (!path) return {};

    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch locale ${locale}: ${response.statusText}`);
      }
      const data = await response.json();
      this.cache.set(locale, data);
      return data;
    } catch (error) {
      console.error(`[I18n] Error loading locale ${locale}:`, error);
      return {};
    }
  }

  private async loadLocale(locale: LocaleId) {
    const localeData = await this.fetchLocaleData(locale);
    this.keys = new Map<string, string>(Object.entries(localeData));
  }

  private formatTranslation(translation: string, params?: Record<string, string | number>): string {
    let formattedTranslation = translation;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        formattedTranslation = formattedTranslation.replaceAll(`{{${k}}}`, String(v));
      });
    }

    return formattedTranslation.replaceAll("{{year}}", new Date().getFullYear().toString());
  }

  private resolveDOMValue(rawValue: string): string {
    return this.resolve(rawValue);
  }

  public resolve(rawValue: string): string {
    const parsed = parseI18nValue(rawValue);
    const resolved = resolveI18nValue(parsed, {
      getCurrent: (key) => this.keys.get(key),
      getDefault: (key) => this.fallbackKeys.get(key),
    });

    return this.formatTranslation(resolved);
  }

  private translateDOM = (nodes: Element[] = [document.documentElement]) => {
    const translateElement = (element: Element) => {
      const key = element.getAttribute("data-i18n");
      if (key !== null) {
        const translated = this.resolveDOMValue(key);
        if (element.textContent !== translated) {
          element.textContent = translated;
        }
      }

      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const attributeKey = `data-i18n-${attribute}`;
        const attrKey = element.getAttribute(attributeKey);
        if (attrKey !== null) {
          const translated = this.resolveDOMValue(attrKey);
          if (element.getAttribute(attribute) !== translated) {
            element.setAttribute(attribute, translated);
          }
        }
      });
    };

    const selectors = [DEFAULT_SELECTOR, ...TRANSLATABLE_ATTRIBUTES.map((attr) => `[data-i18n-${attr}]`)].join(",");

    nodes.forEach((targetNode) => {
      const elementsToTranslate = new Set<Element>();

      if (targetNode.matches && targetNode.matches(selectors) && !isInsideCustomElementTree(targetNode)) {
        elementsToTranslate.add(targetNode);
      }

      targetNode.querySelectorAll(selectors).forEach((el) => {
        if (!isInsideCustomElementTree(el)) {
          elementsToTranslate.add(el);
        }
      });

      elementsToTranslate.forEach(translateElement);
    });
  };

  public getLocales(): Locale[] {
    return VALID_LOCALES;
  }

  public getLocale(): LocaleId {
    return this.currentLocale;
  }

  public async setLocale(locale: LocaleId) {
    this.currentLocale = locale;
    await this.loadLocale(locale);

    if (this.currentLocale !== locale) return;

    document.documentElement.lang = locale;
    i18nStore.set("locale", locale);
    this.isReady = true;
    this.translateDOM();
    this.dispatchEvent(new CustomEvent(EVENT_LOCALE_CHANGED, { detail: { locale } }));
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const translation = this.keys.get(key) ?? this.fallbackKeys.get(key) ?? key;

    return this.formatTranslation(translation, params);
  }

  public onLocaleChange(callback: (locale: LocaleId) => void): () => void {
    const listener: EventListener = (event) => {
      const locale = (event as CustomEvent<LocaleChangedDetail>).detail?.locale;
      if (!locale) {
        return;
      }

      callback(locale);
    };

    this.addEventListener(EVENT_LOCALE_CHANGED, listener);

    return () => {
      this.removeEventListener(EVENT_LOCALE_CHANGED, listener);
    };
  }

  public async init() {
    const fallbackData = await this.fetchLocaleData(DEFAULT_LOCALE);
    this.fallbackKeys = new Map<string, string>(Object.entries(fallbackData));

    await this.setLocale(this.currentLocale);
  }
}

export function createI18n(): I18n {
  return new I18n();
}

export default createI18n();
