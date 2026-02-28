export type { GameStore } from "./storage-types";
export { GameStoreImpl } from "./game-store";

import type { GameStore } from "./storage-types";
import { GameStoreImpl } from "./game-store";

/**
 * Factory for creating namespaced, typed stores.
 *
 * @example
 * interface MySchema { highScore: number }
 * const store = createStore<MySchema>("my-game");
 * store.set("highScore", 100);
 * store.get("highScore"); // 100
 */
export function createStore<T extends { [key: string]: unknown }>(namespace: string): GameStore<T> {
  return new GameStoreImpl<T>(namespace);
}
