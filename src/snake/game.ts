import AudioManager from "../_core/audio";
import { showAlert } from "../_core/utils/alerts";

AudioManager.loadMultipleSFX(["eat", "fail", "complete"]);

// Constants
const COLORS = {
  background: "#262626",
  food: "#22c55e",
  snakeHead: "#fafafa",
  snakeBody: "#d4d4d4",
};

const GAME_CONFIG = {
  tileSize: 20,
  defaultFps: 10,
  localStorageKey: "snake-high-score",
};

// Types
type Point = { x: number; y: number };

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

    // Load High Score
    let savedHighScore = 0;
    try {
      const saved = localStorage.getItem(GAME_CONFIG.localStorageKey);
      if (saved) savedHighScore = parseInt(saved, 10);
    } catch (e) {
      console.warn("LocalStorage access failed", e);
    }

    // Initial State
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
  }

  private initCanvas() {
    // Set canvas size
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    // Align to grid
    this.canvas.width -= this.canvas.width % GAME_CONFIG.tileSize;
    this.canvas.height -= this.canvas.height % GAME_CONFIG.tileSize;

    // Draw initial empty state
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

    // Calculate center
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

    // Prevent 180 reverses
    if (dx !== 0 && this.state.direction.x !== 0) return; // Moving horizontally, can't move horizontal
    if (dy !== 0 && this.state.direction.y !== 0) return; // Moving vertically, can't move vertical

    this.state.nextDirection = { x: dx, y: dy };
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
    // Apply queued direction
    this.state.direction = this.state.nextDirection;

    // If no direction, don't update snake physics
    if (this.state.direction.x === 0 && this.state.direction.y === 0) return;

    const head = { ...this.state.snake[0] };
    head.x += this.state.direction.x * GAME_CONFIG.tileSize;
    head.y += this.state.direction.y * GAME_CONFIG.tileSize;

    // Grid/Wall Collision
    if (
      head.x < 0 ||
      head.x >= this.canvas.width ||
      head.y < 0 ||
      head.y >= this.canvas.height
    ) {
      this.handleGameOver();
      return;
    }

    // Self Collision
    for (const segment of this.state.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.handleGameOver();
        return;
      }
    }

    // Move Snake
    this.state.snake.unshift(head);

    // Food Collision
    if (head.x === this.state.food.x && head.y === this.state.food.y) {
      this.handleEatFood();
    } else {
      this.state.snake.pop();
    }
  }

  private draw() {
    // Clear
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Food
    this.ctx.fillStyle = COLORS.food;
    this.ctx.fillRect(
      this.state.food.x,
      this.state.food.y,
      GAME_CONFIG.tileSize,
      GAME_CONFIG.tileSize,
    );

    // Draw Snake
    this.state.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
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
      try {
        localStorage.setItem(
          GAME_CONFIG.localStorageKey,
          this.state.highScore.toString(),
        );
      } catch (e) {
        /* Check quota or privacy mode */
      }
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

    if (this.state.snake.length >= cols * rows) {
      this.handleGameWin();
      return;
    }

    let valid = false;
    let attempts = 0;

    // Try random placement first
    while (!valid && attempts < maxAttempts) {
      this.state.food = {
        x: Math.floor(Math.random() * cols) * GAME_CONFIG.tileSize,
        y: Math.floor(Math.random() * rows) * GAME_CONFIG.tileSize,
      };

      valid = !this.state.snake.some(
        (s) => s.x === this.state.food.x && s.y === this.state.food.y,
      );
      attempts++;
    }

    // If still not valid, try linear scan to find any open spot
    if (!valid) {
      // Create a set of occupied keys for O(1) lookup
      const occupied = new Set(this.state.snake.map((s) => `${s.x},${s.y}`));

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const px = x * GAME_CONFIG.tileSize;
          const py = y * GAME_CONFIG.tileSize;
          if (!occupied.has(`${px},${py}`)) {
            this.state.food = { x: px, y: py };
            valid = true;
            break;
          }
        }
        if (valid) break;
      }
    }

    if (!valid) {
      // No space left at all -> You Win!
      this.handleGameWin();
    }
  }
}
