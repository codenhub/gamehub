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

type I18nSchema = {
  locale: LocaleId;
};

const i18nStore = createStore<I18nSchema>("settings");

export function isValidLocale(value: unknown): value is LocaleId {
  return typeof value === "string" && LOCALES_ID.includes(value as LocaleId);
}

export function findLocale(id: LocaleId): Locale | undefined {
  return VALID_LOCALES.find((l) => l.id === id);
}

class I18n extends EventTarget {
  private currentLocale: LocaleId;
  private keys: Map<string, string> = new Map<string, string>();
  private fallbackKeys: Map<string, string> = new Map<string, string>();
  private isReady: boolean = false;
  private observer: MutationObserver | null = null;
  private translateTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.currentLocale = i18nStore.get("locale") || DEFAULT_LOCALE;
  }

  private async fetchLocaleData(locale: LocaleId): Promise<Record<string, string>> {
    const path = findLocale(locale)?.path;
    if (!path) return {};

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch locale ${locale}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[I18n] Error loading locale ${locale}:`, error);
      return {};
    }
  }

  private async loadLocale(locale: LocaleId) {
    const localeData = await this.fetchLocaleData(locale);
    this.keys = new Map<string, string>(Object.entries(localeData));
  }

  private translateDOM = () => {
    if (this.observer) {
      this.observer.disconnect();
    }

    const elements = document.querySelectorAll(DEFAULT_SELECTOR);
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (key) {
        element.textContent = this.t(key);
      }
    });

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
      const attributeKey = `data-i18n-${attribute}`;
      const nodes = document.querySelectorAll(`[${attributeKey}]`);
      nodes.forEach((node) => {
        const key = node.getAttribute(attributeKey);
        if (key) {
          node.setAttribute(attribute, this.t(key));
        }
      });
    });

    if (this.observer) {
      this.observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  private scheduleTranslateDOM() {
    if (this.translateTimeout) {
      clearTimeout(this.translateTimeout);
    }
    this.translateTimeout = setTimeout(() => {
      this.translateDOM();
    }, 10);
  }

  public getLocales(): Locale[] {
    return VALID_LOCALES;
  }

  public getLocale(): LocaleId {
    return this.currentLocale;
  }

  public async setLocale(locale: LocaleId) {
    await this.loadLocale(locale);
    this.currentLocale = locale;
    i18nStore.set("locale", locale);
    this.isReady = true;
    this.translateDOM();
    this.dispatchEvent(new CustomEvent(EVENT_LOCALE_CHANGED, { detail: { locale } }));
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public t(key: string, params?: Record<string, string | number>): string {
    let translation = this.keys.get(key) ?? this.fallbackKeys.get(key) ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`{{${k}}}`, "g"), String(v));
      });
    } else {
      translation = translation.replace(/{{year}}/g, new Date().getFullYear().toString());
    }

    return translation;
  }

  public async init() {
    const fallbackData = await this.fetchLocaleData(DEFAULT_LOCALE);
    this.fallbackKeys = new Map<string, string>(Object.entries(fallbackData));

    await this.setLocale(this.currentLocale);

    // Watch for dynamic DOM changes to translate newly added Light DOM WebComponents.
    this.observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
      }
      if (shouldTranslate) {
        this.scheduleTranslateDOM();
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }
}

export function createI18n(): I18n {
  return new I18n();
}

export default createI18n();
