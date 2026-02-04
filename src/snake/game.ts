import AudioManager from "../_core/audio";
import { showAlert } from "../_core/utils/alerts";

// Constants & Config
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

type Point = { x: number; y: number };

export type GameCallbacks = {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
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
  animationId: number | null;
  lastRenderTime: number;
}

// Global State (Module Level)
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let callbacks: GameCallbacks;

// Initial State Factory
const createInitialState = (): GameState => ({
  snake: [],
  food: { x: 0, y: 0 },
  direction: { x: 0, y: 0 },
  nextDirection: { x: 0, y: 0 },
  score: 0,
  highScore: 0,
  isPaused: false,
  isRunning: false,
  animationId: null,
  lastRenderTime: 0,
});

let state: GameState = createInitialState();

// Initialization
export function initGame(
  gameCanvas: HTMLCanvasElement,
  gameCallbacks: GameCallbacks,
): void {
  canvas = gameCanvas;
  const context = canvas.getContext("2d");

  if (!context) {
    showAlert({
      message: "Failed to get canvas context. Game cannot start.",
      type: "error",
    });
    console.error("Failed to get 2D context");
    return;
  }

  ctx = context;
  callbacks = gameCallbacks;

  // Set canvas size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Align to grid
  canvas.width -= canvas.width % GAME_CONFIG.tileSize;
  canvas.height -= canvas.height % GAME_CONFIG.tileSize;

  loadHighScore();
  callbacks.onScoreUpdate(0, state.highScore);

  draw();
}

// Game Logic
export function startGame(): void {
  if (state.animationId) cancelAnimationFrame(state.animationId);

  // Reset core game state while preserving high score
  const currentHighScore = state.highScore;
  state = createInitialState();
  state.highScore = currentHighScore;
  state.isRunning = true;

  // Center start
  const startX =
    Math.floor(canvas.width / GAME_CONFIG.tileSize / 2) * GAME_CONFIG.tileSize;
  const startY =
    Math.floor(canvas.height / GAME_CONFIG.tileSize / 2) * GAME_CONFIG.tileSize;

  state.snake = [{ x: startX, y: startY }];
  state.direction = { x: 0, y: 0 };
  state.nextDirection = { x: 0, y: 0 };

  spawnFood();
  callbacks.onScoreUpdate(state.score, state.highScore);

  gameLoop();
}

function gameLoop(currentTime?: number) {
  if (!state.isRunning) return;

  state.animationId = requestAnimationFrame(gameLoop);

  if (!currentTime) return;
  const secondsSinceLastRender = (currentTime - state.lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / GAME_CONFIG.defaultFps) return;

  state.lastRenderTime = currentTime;

  if (!state.isPaused) {
    update();
    draw();
  }
}

function update() {
  // Apply queued direction
  state.direction = state.nextDirection;

  // If stationary, don't move
  if (state.direction.x === 0 && state.direction.y === 0) return;

  const head = { ...state.snake[0] };
  head.x += state.direction.x * GAME_CONFIG.tileSize;
  head.y += state.direction.y * GAME_CONFIG.tileSize;

  // Wall Collision
  if (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height
  ) {
    handleGameOver();
    return;
  }

  // Self Collision
  for (let i = 0; i < state.snake.length; i++) {
    if (head.x === state.snake[i].x && head.y === state.snake[i].y) {
      handleGameOver();
      return;
    }
  }

  state.snake.unshift(head);

  // Check Food
  if (head.x === state.food.x && head.y === state.food.y) {
    handleEatFood();
  } else {
    state.snake.pop();
  }
}

function handleEatFood() {
  state.score += 10;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore();
  }
  callbacks.onScoreUpdate(state.score, state.highScore);
  AudioManager.playSFX("eat");
  spawnFood();
}

function handleGameOver() {
  AudioManager.playSFX("die");
  stopGame();
  callbacks.onGameOver(state.score);
}

function spawnFood() {
  const cols = canvas.width / GAME_CONFIG.tileSize;
  const rows = canvas.height / GAME_CONFIG.tileSize;
  const maxAttempts = cols * rows;
  let attempts = 0;
  let valid = false;

  while (!valid && attempts < maxAttempts) {
    state.food = {
      x: Math.floor(Math.random() * cols) * GAME_CONFIG.tileSize,
      y: Math.floor(Math.random() * rows) * GAME_CONFIG.tileSize,
    };

    // Check if on snake
    valid = !state.snake.some(
      (s) => s.x === state.food.x && s.y === state.food.y,
    );
    attempts++;
  }

  if (!valid) {
    // Should count as a win or just game over if board is full
    console.warn("No valid space for food!");
    // For now, treat as game over if we really can't spawn food (perfect game?)
    handleGameOver();
  }
}

function draw() {
  // Clear
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Food
  ctx.fillStyle = COLORS.food;
  ctx.fillRect(
    state.food.x,
    state.food.y,
    GAME_CONFIG.tileSize,
    GAME_CONFIG.tileSize,
  );

  // Draw Snake
  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
    ctx.fillRect(
      segment.x,
      segment.y,
      GAME_CONFIG.tileSize,
      GAME_CONFIG.tileSize,
    );
  });
}

// Storage Helpers
function loadHighScore() {
  try {
    const saved = localStorage.getItem(GAME_CONFIG.localStorageKey);
    if (saved) {
      state.highScore = parseInt(saved, 10);
    }
  } catch (error) {
    console.warn("Failed to load high score from localStorage", error);
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(
      GAME_CONFIG.localStorageKey,
      state.highScore.toString(),
    );
  } catch (error) {
    console.warn("Failed to save high score to localStorage", error);
  }
}

// Controls & Lifecycle
export function pauseGame(): void {
  state.isPaused = true;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
}

export function resumeGame(): void {
  if (state.isPaused) {
    state.isPaused = false;
    gameLoop();
  }
}

export function stopGame(): void {
  state.isRunning = false;
  state.isPaused = false;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
}

export function moveUp(): void {
  if (state.direction.y === 0) state.nextDirection = { x: 0, y: -1 };
}

export function moveDown(): void {
  if (state.direction.y === 0) state.nextDirection = { x: 0, y: 1 };
}

export function moveLeft(): void {
  if (state.direction.x === 0) state.nextDirection = { x: -1, y: 0 };
}

export function moveRight(): void {
  if (state.direction.x === 0) state.nextDirection = { x: 1, y: 0 };
}
