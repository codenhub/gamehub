/**
 * Callbacks that every game can invoke to communicate with the shell/UI layer.
 * `onGameWin` is optional — not every game has a win condition.
 */
export interface GameCallbacks {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
  onGameWin?: (finalScore: number) => void;
}

/**
 * Minimal lifecycle contract that every game must implement.
 * Optional methods are only required for games that support pausing.
 */
export interface Game {
  start(): void;
  stop(): void;
  pause?(): void;
  resume?(): void;
  destroy?(): void;
}
