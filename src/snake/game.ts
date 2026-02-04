import AudioManager from "../_core/audio";

type Point = { x: number; y: number };
type GameCallbacks = {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let callbacks: GameCallbacks;

// Game Config
const TILE_SIZE = 20;
let FPS = 10;

// Game State
let animationId: number | null = null;
let snake: Point[] = [];
let food: Point = { x: 0, y: 0 };
let direction: Point = { x: 0, y: 0 };
let nextDirection: Point = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let isPaused = false;

export function initGame(
  gameCanvas: HTMLCanvasElement,
  gameCallbacks: GameCallbacks,
): void {
  canvas = gameCanvas;
  ctx = canvas.getContext("2d")!;
  callbacks = gameCallbacks;

  // Set canvas size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Align to grid
  canvas.width -= canvas.width % TILE_SIZE;
  canvas.height -= canvas.height % TILE_SIZE;

  // Load High Score
  const savedHighScore = localStorage.getItem("snake-high-score");
  if (savedHighScore) {
    highScore = parseInt(savedHighScore, 10);
  }
  callbacks.onScoreUpdate(0, highScore);

  draw();
}

export function startGame(): void {
  if (animationId) cancelAnimationFrame(animationId);

  // Reset State
  isPaused = false;
  score = 0;
  // Start in middle
  const startX = Math.floor(canvas.width / TILE_SIZE / 2) * TILE_SIZE;
  const startY = Math.floor(canvas.height / TILE_SIZE / 2) * TILE_SIZE;
  snake = [{ x: startX, y: startY }];
  direction = { x: 0, y: 0 }; // Stationary start
  nextDirection = { x: 0, y: 0 };

  spawnFood();
  callbacks.onScoreUpdate(score, highScore);

  gameLoop();
}

export function pauseGame(): void {
  isPaused = true;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function resumeGame(): void {
  if (isPaused) {
    isPaused = false;
    gameLoop();
  }
}

export function stopGame(): void {
  isPaused = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

let lastRenderTime = 0;
function gameLoop(currentTime?: number) {
  animationId = requestAnimationFrame(gameLoop);

  if (!currentTime) return;
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / FPS) return;

  lastRenderTime = currentTime;

  update();
  draw();
}

function update() {
  // Apply queued direction
  direction = nextDirection;

  // If no direction (start of game), don't update snake
  if (direction.x === 0 && direction.y === 0) return;

  const head = { ...snake[0] };
  head.x += direction.x * TILE_SIZE;
  head.y += direction.y * TILE_SIZE;

  // Wall Collision
  if (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height
  ) {
    AudioManager.playSFX("die");
    gameOver();
    return;
  }

  // Self Collision
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      AudioManager.playSFX("die");
      gameOver();
      return;
    }
  }

  snake.unshift(head); // Add new head

  // Check Food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snake-high-score", highScore.toString());
    }
    callbacks.onScoreUpdate(score, highScore);
    AudioManager.playSFX("eat");
    spawnFood();
  } else {
    snake.pop(); // Remove tail
  }
}

function draw() {
  // Clear
  ctx.fillStyle = "#1a1a1a"; // Dark background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Food
  ctx.fillStyle = "#ff5555"; // Red food
  ctx.fillRect(food.x, food.y, TILE_SIZE, TILE_SIZE);

  // Draw Snake
  ctx.fillStyle = "#55ff55"; // Green snake
  snake.forEach((segment, index) => {
    // Make head slightly different
    ctx.fillStyle = index === 0 ? "#88ff88" : "#55ff55";
    ctx.fillRect(segment.x, segment.y, TILE_SIZE, TILE_SIZE);
  });
}

function spawnFood() {
  // Random grid position
  const cols = canvas.width / TILE_SIZE;
  const rows = canvas.height / TILE_SIZE;

  // Simple random
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * cols) * TILE_SIZE,
      y: Math.floor(Math.random() * rows) * TILE_SIZE,
    };
    // Check if on snake
    valid = !snake.some((s) => s.x === food.x && s.y === food.y);
  }
}

function gameOver() {
  stopGame();
  callbacks.onGameOver(score);
}

// Controls
export function moveUp(): void {
  if (direction.y === 0) nextDirection = { x: 0, y: -1 };
}

export function moveDown(): void {
  if (direction.y === 0) nextDirection = { x: 0, y: 1 };
}

export function moveLeft(): void {
  if (direction.x === 0) nextDirection = { x: -1, y: 0 };
}

export function moveRight(): void {
  if (direction.x === 0) nextDirection = { x: 1, y: 0 };
}
