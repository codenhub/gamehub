import AudioManager from "../../_core/audio";
import { createStore } from "../../_core/storage";
import type { Grid } from "../common/types";
import { DEFAULT_TILE, TILE_COLORS } from "./constants";
import {
  type Direction,
  GRID_SIZE,
  createEmptyGrid,
  addRandomTile,
  moveGrid,
  hasAvailableMoves,
  hasWon,
} from "./logic";

AudioManager.loadMultipleSFX(["place", "hit", "fail", "complete"]);

type Game2048Schema = {
  highScore: number;
};

const store = createStore<Game2048Schema>("2048");

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

/**
 * Main class for the 2048 game implementation.
 * Manages grid state, user moves, score persistence, and DOM rendering.
 */
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
      const saved = store.get("highScore");
      if (saved !== null) {
        savedHighScore = Number.isNaN(saved) ? 0 : saved;
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
      store.set("highScore", this.state.highScore);
    }

    this.callbacks.onScoreUpdate(this.state.score, this.state.highScore);

    if (result.score > 0) {
      AudioManager.playSFX("hit");
    } else {
      AudioManager.playSFX("place");
    }

    // Add new tile
    this.state.grid = addRandomTile(this.state.grid);
    this.render();

    // Check win
    if (!this.state.hasReachedWin && hasWon(this.state.grid)) {
      this.state.hasReachedWin = true;
      this.state.isRunning = false;
      this.callbacks.onGameWin(this.state.score);

      AudioManager.playSFX("complete");
      return;
    }

    // Check game over
    if (!hasAvailableMoves(this.state.grid)) {
      this.state.isRunning = false;
      this.callbacks.onGameOver(this.state.score);

      AudioManager.playSFX("fail");
    }
  }

  public stop() {
    this.state.isRunning = false;
  }
}
