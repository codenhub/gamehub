/**
 * Generic store interface for namespaced localStorage access.
 * Consumers supply their own schema `T` to get typed keys and values.
 */
export interface GameStore<T extends { [key: string]: unknown }> {
  get<K extends keyof T & string>(key: K): T[K] | null;
  set<K extends keyof T & string>(key: K, value: T[K]): void;
  remove<K extends keyof T & string>(key: K): void;
}
