import type { GameStore } from "./storage-types";

const SEPARATOR = ":";

function buildKey(namespace: string, key: string): string {
  return `${namespace}${SEPARATOR}${key}`;
}

/**
 * Concrete implementation of GameStore backed by localStorage.
 * All reads/writes are wrapped in try/catch to handle
 * quota errors, private browsing restrictions, etc.
 */
export class GameStoreImpl<T extends { [key: string]: unknown }> implements GameStore<T> {
  private readonly namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  get<K extends keyof T & string>(key: K): T[K] | null {
    try {
      const raw = localStorage.getItem(buildKey(this.namespace, key));
      if (raw === null) return null;
      return JSON.parse(raw) as T[K];
    } catch (error) {
      console.warn(`[Storage] Failed to read "${this.namespace}:${key}":`, error);
      return null;
    }
  }

  set<K extends keyof T & string>(key: K, value: T[K]): void {
    try {
      localStorage.setItem(buildKey(this.namespace, key), JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage] Failed to write "${this.namespace}:${key}":`, error);
    }
  }

  remove<K extends keyof T & string>(key: K): void {
    try {
      localStorage.removeItem(buildKey(this.namespace, key));
    } catch (error) {
      console.warn(`[Storage] Failed to remove "${this.namespace}:${key}":`, error);
    }
  }
}
