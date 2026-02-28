import AudioManager from "../../_core/audio";
import { createStore } from "../../_core/storage";
import { showAlert } from "../../_ui/scripts/alerts";
import ThemeManager from "../../_ui/scripts/theme";
import type { Point } from "../common/types";
import { GAME_CONFIG } from "./constants";
import {
  isReverseDirection,
  moveHead,
  isWallCollision,
  isSelfCollision,
  isGridFull,
  findFirstEmptyTile,
} from "./logic";

AudioManager.loadMultipleSFX(["eat", "fail", "complete"]);

const getColors = () => ({
  background: ThemeManager.getColor("--color-foreground"),
  food: ThemeManager.getColor("--color-success"),
  snakeHead: ThemeManager.getColor("--color-primary"),
  snakeBody: ThemeManager.getColor("--color-accent"),
});

type GameColors = ReturnType<typeof getColors>;

type SnakeSchema = {
  highScore: number;
};

const store = createStore<SnakeSchema>("snake");

export type GameCallbacks = {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
  onGameWin: (finalScore: number) => void;
};

interface GameState {
  snake: Point[];
  food: Point;
  direction: Point;
  nextDirection: Point;
  score: number;
  highScore: number;
  isPaused: boolean;
  isRunning: boolean;
}

/**
 * Main class for the Snake game implementation.
 * Manages game loop, state, rendering, and logic.
 */
export class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private state: GameState;
  private animationId: number | null = null;
  private lastRenderTime = 0;
  private colors: GameColors = getColors();
  private resizeObserver: ResizeObserver | null = null;

  private readonly handleThemeChanged = () => {
    this.colors = getColors();
    this.draw();
  };

  private readonly handleResize = () => {
    const hasCanvasResized = this.resizeCanvas();
    if (!hasCanvasResized) return;

    this.syncStateWithCanvasBounds();
    this.draw();
  };

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const context = this.canvas.getContext("2d");
    if (!context) {
      showAlert({
        message: "Failed to get canvas context. Game cannot start.",
        type: "error",
      });
      throw new Error("Failed to get 2D context");
    }
    this.ctx = context;

    let savedHighScore = 0;
    try {
      const saved = store.get("highScore");
      if (saved !== null) {
        savedHighScore = Number.isNaN(saved) ? 0 : saved;
      }
    } catch (error) {
      console.warn("[Snake] Failed to load high score:", error);
    }

    this.state = {
      snake: [],
      food: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      nextDirection: { x: 0, y: 0 },
      score: 0,
      highScore: savedHighScore,
      isPaused: false,
      isRunning: false,
    };

    this.initCanvas();
    this.setupResizeObserver();
    this.setupThemeListener();
  }

  private setupThemeListener() {
    window.addEventListener("theme-changed", this.handleThemeChanged);
  }

  private setupResizeObserver() {
    const target = this.canvas.parentElement ?? this.canvas;

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.handleResize);
      return;
    }

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(target);
  }

  private initCanvas() {
    this.resizeCanvas();

    this.draw();
    this.callbacks.onScoreUpdate(0, this.state.highScore);
  }

  private resizeCanvas(): boolean {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (width < GAME_CONFIG.tileSize || height < GAME_CONFIG.tileSize) {
      return false;
    }

    const snappedWidth = width - (width % GAME_CONFIG.tileSize);
    const snappedHeight = height - (height % GAME_CONFIG.tileSize);

    if (snappedWidth === this.canvas.width && snappedHeight === this.canvas.height) {
      return false;
    }

    this.canvas.width = snappedWidth;
    this.canvas.height = snappedHeight;

    return true;
  }

  private syncStateWithCanvasBounds() {
    if (this.state.snake.length > 0) {
      const maxX = this.canvas.width - GAME_CONFIG.tileSize;
      const maxY = this.canvas.height - GAME_CONFIG.tileSize;

      this.state.snake = this.state.snake.map((segment) => ({
        x: Math.min(Math.max(segment.x, 0), maxX),
        y: Math.min(Math.max(segment.y, 0), maxY),
      }));
    }

    const isFoodInsideCanvas =
      this.state.food.x >= 0 &&
      this.state.food.x < this.canvas.width &&
      this.state.food.y >= 0 &&
      this.state.food.y < this.canvas.height;

    if (!isFoodInsideCanvas) {
      this.spawnFood();
    }
  }

  public start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    // Reset State (keep high score)
    const currentHighScore = this.state.highScore;
    this.state = {
      ...this.state,
      snake: [],
      score: 0,
      highScore: currentHighScore,
      isPaused: false,
      isRunning: true,
      direction: { x: 0, y: 0 },
      nextDirection: { x: 0, y: 0 },
    };

    const startX = Math.floor(this.canvas.width / GAME_CONFIG.tileSize / 2) * GAME_CONFIG.tileSize;
    const startY = Math.floor(this.canvas.height / GAME_CONFIG.tileSize / 2) * GAME_CONFIG.tileSize;

    this.state.snake = [{ x: startX, y: startY }];

    // Spawn first food
    this.spawnFood();

    this.callbacks.onScoreUpdate(this.state.score, this.state.highScore);

    this.gameLoop();
  }

  public pause() {
    this.state.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resume() {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.gameLoop();
    }
  }

  public stop() {
    this.state.isRunning = false;
    this.state.isPaused = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy() {
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("theme-changed", this.handleThemeChanged);
  }

  public queueMove(dx: number, dy: number) {
    if (!this.state.isRunning || this.state.isPaused) return;

    const next = { x: dx, y: dy };
    if (isReverseDirection(this.state.direction, next)) return;

    this.state.nextDirection = next;
  }

  public moveUp() {
    this.queueMove(0, -1);
  }
  public moveDown() {
    this.queueMove(0, 1);
  }
  public moveLeft() {
    this.queueMove(-1, 0);
  }
  public moveRight() {
    this.queueMove(1, 0);
  }

  private gameLoop = (currentTime: number = 0) => {
    if (!this.state.isRunning) return;

    this.animationId = requestAnimationFrame(this.gameLoop);

    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / GAME_CONFIG.defaultFps) return;

    this.lastRenderTime = currentTime;

    if (!this.state.isPaused) {
      this.update();
      this.draw();
    }
  };

  private update() {
    this.state.direction = this.state.nextDirection;

    if (this.state.direction.x === 0 && this.state.direction.y === 0) return;

    const head = moveHead({
      head: this.state.snake[0],
      direction: this.state.direction,
      tileSize: GAME_CONFIG.tileSize,
    });

    if (
      isWallCollision({
        point: head,
        width: this.canvas.width,
        height: this.canvas.height,
      })
    ) {
      this.handleGameOver();
      return;
    }

    if (isSelfCollision(head, this.state.snake)) {
      this.handleGameOver();
      return;
    }

    this.state.snake.unshift(head);

    if (head.x === this.state.food.x && head.y === this.state.food.y) {
      this.handleEatFood();
    } else {
      this.state.snake.pop();
    }
  }

  private draw() {
    // Clear
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Food
    this.ctx.fillStyle = this.colors.food;
    this.ctx.fillRect(this.state.food.x, this.state.food.y, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);

    // Draw Snake
    this.state.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? this.colors.snakeHead : this.colors.snakeBody;
      this.ctx.fillRect(segment.x, segment.y, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
    });
  }

  private handleEatFood() {
    this.state.score += 10;

    // Update High Score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      store.set("highScore", this.state.highScore);
    }

    this.callbacks.onScoreUpdate(this.state.score, this.state.highScore);

    AudioManager.playSFX("eat");

    this.spawnFood();
  }

  private handleGameOver() {
    AudioManager.playSFX("fail");

    this.stop();
    this.callbacks.onGameOver(this.state.score);
  }

  private handleGameWin() {
    this.stop();
    this.callbacks.onGameWin(this.state.score);

    AudioManager.playSFX("complete");
  }

  private spawnFood() {
    const cols = this.canvas.width / GAME_CONFIG.tileSize;
    const rows = this.canvas.height / GAME_CONFIG.tileSize;
    const maxAttempts = cols * rows;

    if (isGridFull(this.state.snake.length, cols, rows)) {
      this.handleGameWin();
      return;
    }

    let valid = false;
    let attempts = 0;

    while (!valid && attempts < maxAttempts) {
      this.state.food = {
        x: Math.floor(Math.random() * cols) * GAME_CONFIG.tileSize,
        y: Math.floor(Math.random() * rows) * GAME_CONFIG.tileSize,
      };

      valid = !isSelfCollision(this.state.food, this.state.snake);
      attempts++;
    }

    if (!valid) {
      const occupied = new Set(this.state.snake.map((s) => `${s.x},${s.y}`));
      const tile = findFirstEmptyTile({
        cols,
        rows,
        tileSize: GAME_CONFIG.tileSize,
        occupied,
      });

      if (tile) {
        this.state.food = tile;
      } else {
        this.handleGameWin();
      }
    }
  }
}
