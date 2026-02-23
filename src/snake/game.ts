import AudioManager from "../_core/audio";
import { createStore } from "../_core/storage";
import { showAlert } from "../_core/utils/alerts";
import ThemeManager from "../_core/utils/theme";
import {
  type Point,
  TILE_SIZE,
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

type SnakeSchema = {
  highScore: number;
};

const store = createStore<SnakeSchema>("snake");

const GAME_CONFIG = {
  tileSize: TILE_SIZE,
  defaultFps: 10,
};

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

export class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private state: GameState;
  private animationId: number | null = null;
  private lastRenderTime = 0;

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
    this.setupThemeListener();
  }

  private setupThemeListener() {
    window.addEventListener("theme-changed", () => {
      this.draw();
    });
  }

  private initCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.canvas.width -= this.canvas.width % GAME_CONFIG.tileSize;
    this.canvas.height -= this.canvas.height % GAME_CONFIG.tileSize;

    this.draw();
    this.callbacks.onScoreUpdate(0, this.state.highScore);
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

    const startX =
      Math.floor(this.canvas.width / GAME_CONFIG.tileSize / 2) *
      GAME_CONFIG.tileSize;
    const startY =
      Math.floor(this.canvas.height / GAME_CONFIG.tileSize / 2) *
      GAME_CONFIG.tileSize;

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

  // Input Handlers
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

  // Core Loop
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
    const colors = getColors();
    // Clear
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Food
    this.ctx.fillStyle = colors.food;
    this.ctx.fillRect(
      this.state.food.x,
      this.state.food.y,
      GAME_CONFIG.tileSize,
      GAME_CONFIG.tileSize,
    );

    // Draw Snake
    this.state.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snakeBody;
      this.ctx.fillRect(
        segment.x,
        segment.y,
        GAME_CONFIG.tileSize,
        GAME_CONFIG.tileSize,
      );
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

    AudioManager.playSFX("eat").catch((err) => {
      console.warn("[Snake] Failed to play eat SFX:", err);
    });

    this.spawnFood();
  }

  private handleGameOver() {
    AudioManager.playSFX("fail").catch((err) => {
      console.warn("[Snake] Failed to play fail SFX:", err);
    });

    this.stop();
    this.callbacks.onGameOver(this.state.score);
  }

  private handleGameWin() {
    this.stop();
    this.callbacks.onGameWin(this.state.score);

    AudioManager.playSFX("complete").catch((err) => {
      console.warn("[Snake] Failed to play complete SFX:", err);
    });
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
