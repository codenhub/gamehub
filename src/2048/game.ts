import AudioManager from "../_core/audio";
import {
  type Grid,
  type Direction,
  GRID_SIZE,
  createEmptyGrid,
  addRandomTile,
  moveGrid,
  hasAvailableMoves,
  hasWon,
} from "./logic";

AudioManager.loadMultipleSFX(["place", "hit", "fail", "complete"]);

const GAME_CONFIG = {
  localStorageKey: "2048-high-score",
};

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
};

const DEFAULT_TILE = { bg: "#3c3a32", text: "#f9f6f2" };

export type GameCallbacks = {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
  onGameWin: (finalScore: number) => void;
};

interface GameState {
  grid: Grid;
  score: number;
  highScore: number;
  isRunning: boolean;
  hasReachedWin: boolean;
}

export class Game2048 {
  private container: HTMLElement;
  private callbacks: GameCallbacks;
  private state: GameState;
  private tileElements: HTMLElement[][] = [];

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    let savedHighScore = 0;
    try {
      const saved = localStorage.getItem(GAME_CONFIG.localStorageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        savedHighScore = Number.isNaN(parsed) ? 0 : parsed;
      }
    } catch (error) {
      console.warn("[2048] Failed to load high score:", error);
    }

    this.state = {
      grid: createEmptyGrid(),
      score: 0,
      highScore: savedHighScore,
      isRunning: false,
      hasReachedWin: false,
    };

    this.initGrid();
    this.callbacks.onScoreUpdate(0, this.state.highScore);
  }

  private initGrid() {
    this.container.innerHTML = "";

    for (let r = 0; r < GRID_SIZE; r++) {
      this.tileElements[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = document.createElement("div");
        tile.className = "game-tile";
        this.container.appendChild(tile);
        this.tileElements[r][c] = tile;
      }
    }

    this.render();
  }

  private render() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = this.state.grid[r][c];
        const tile = this.tileElements[r][c];

        tile.textContent = value > 0 ? value.toString() : "";
        tile.dataset.value = value.toString();

        const colors = value > 0 ? (TILE_COLORS[value] ?? DEFAULT_TILE) : null;

        if (colors) {
          tile.style.backgroundColor = colors.bg;
          tile.style.color = colors.text;
        } else {
          tile.style.backgroundColor = "var(--color-background)";
          tile.style.color = "transparent";
        }

        if (value > 1024) tile.style.fontSize = "2.75rem";
      }
    }
  }

  public start() {
    const currentHighScore = this.state.highScore;

    this.state = {
      grid: createEmptyGrid(),
      score: 0,
      highScore: currentHighScore,
      isRunning: true,
      hasReachedWin: false,
    };

    // Place two initial tiles
    this.state.grid = addRandomTile(this.state.grid);
    this.state.grid = addRandomTile(this.state.grid);

    this.callbacks.onScoreUpdate(this.state.score, this.state.highScore);
    this.render();
  }

  public move(direction: Direction) {
    if (!this.state.isRunning) return;

    const result = moveGrid(this.state.grid, direction);
    if (!result.hasMoved) return;

    this.state.grid = result.grid;
    this.state.score += result.score;

    // Update high score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      try {
        localStorage.setItem(
          GAME_CONFIG.localStorageKey,
          this.state.highScore.toString(),
        );
      } catch (error) {
        console.warn("[2048] Failed to save high score:", error);
      }
    }

    this.callbacks.onScoreUpdate(this.state.score, this.state.highScore);

    if (result.score > 0) {
      AudioManager.playSFX("hit").catch((err) => {
        console.warn("[2048] Failed to play merge SFX:", err);
      });
    } else {
      AudioManager.playSFX("place").catch((err) => {
        console.warn("[2048] Failed to play place SFX:", err);
      });
    }

    // Add new tile
    this.state.grid = addRandomTile(this.state.grid);
    this.render();

    // Check win
    if (!this.state.hasReachedWin && hasWon(this.state.grid)) {
      this.state.hasReachedWin = true;
      this.state.isRunning = false;
      this.callbacks.onGameWin(this.state.score);

      AudioManager.playSFX("complete").catch((err) => {
        console.warn("[2048] Failed to play win SFX:", err);
      });
      return;
    }

    // Check game over
    if (!hasAvailableMoves(this.state.grid)) {
      this.state.isRunning = false;
      this.callbacks.onGameOver(this.state.score);

      AudioManager.playSFX("fail").catch((err) => {
        console.warn("[2048] Failed to play fail SFX:", err);
      });
    }
  }

  public stop() {
    this.state.isRunning = false;
  }
}
