// Types
type PieceMatrix = number[][];

// GAME CONSTANTS
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const LOCAL_STORAGE_KEY = "geometric-fall-high-score";
const COLORS = {
  piece: "#f5f5f5",
  background: "#171717",
  grid: "#404040",
};

// TETROMINOES
const TETROMINOES: Record<string, PieceMatrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// ROTATE PIECE
const rotatePiece = (piece: PieceMatrix): PieceMatrix => {
  const rows = piece.length;
  const cols = piece[0].length;
  const rotated: PieceMatrix = Array.from({ length: cols }, () =>
    Array(rows).fill(0),
  );
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = piece[y][x];
    }
  }
  return rotated;
};

// GAME VARIABLES
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let grid: number[][] = [];
let currentPiece: PieceMatrix;
let currentX: number;
let currentY: number;
let score = 0;
let highScore = loadHighScore();
let gameLoop: ReturnType<typeof setInterval>;
let isPlaying = false;
let isInitialized = false;

// HIGH SCORE PERSISTENCE
function loadHighScore(): number {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return 0;

    const parsed = parseInt(saved, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.warn("[GeometricFall] Failed to load high score:", error);
    return 0;
  }
}

const saveHighScore = () => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, highScore.toString());
  } catch (error) {
    console.warn("[GeometricFall] Failed to save high score:", error);
  }
};

// INITIALIZE GAME
const initGame = (): boolean => {
  const canvasEl = document.getElementById("game");
  if (!(canvasEl instanceof HTMLCanvasElement)) {
    console.error("[GeometricFall] Canvas element #game not found");
    return false;
  }
  canvas = canvasEl;

  const context = canvas.getContext("2d");
  if (!context) {
    console.error("[GeometricFall] Failed to get 2D canvas context");
    return false;
  }
  ctx = context;

  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  resetGrid();
  spawnPiece();
  updateScore();
  draw();
  isInitialized = true;
  return true;
};

// RESET GRID
const resetGrid = () => {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
};

// SPAWN NEW PIECE
const spawnPiece = () => {
  const pieces = Object.keys(TETROMINOES);
  if (pieces.length === 0) {
    console.error("[GeometricFall] No tetrominoes defined");
    return;
  }

  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
  currentPiece = TETROMINOES[randomPiece];
  currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
  currentY = 0;
};

// DRAW GAME
const draw = () => {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = COLORS.grid;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(canvas.width, y * BLOCK_SIZE);
    ctx.stroke();
  }

  // Draw placed pieces
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        ctx.fillStyle = COLORS.piece;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  // Draw current piece
  ctx.fillStyle = COLORS.piece;
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        ctx.fillRect(
          (currentX + x) * BLOCK_SIZE,
          (currentY + y) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE,
        );
        ctx.strokeRect(
          (currentX + x) * BLOCK_SIZE,
          (currentY + y) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE,
        );
      }
    }
  }
};

// CHECK COLLISION
const isValidMove = (piece: PieceMatrix, x: number, y: number): boolean => {
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (piece[py][px]) {
        const newX = x + px;
        const newY = y + py;
        if (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && grid[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

// PLACE PIECE
const placePiece = () => {
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        const gridY = currentY + y;
        const gridX = currentX + x;

        // Bounds safety — should always be valid if isValidMove was checked,
        // but guard against edge cases
        if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
          grid[gridY][gridX] = 1;
        }
      }
    }
  }
  clearLines();
  spawnPiece();
  if (!isValidMove(currentPiece, currentX, currentY)) {
    gameOver();
  }
};

// CLEAR LINES
const clearLines = () => {
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every((cell) => cell !== 0)) {
      grid.splice(y, 1);
      grid.unshift(Array(COLS).fill(0));
      score += 100;
      updateScore();
      y++; // Check the same line again
    }
  }
};

// UPDATE SCORE
const updateScore = () => {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }

  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  if (scoreEl) scoreEl.textContent = score.toString();
  if (highScoreEl) highScoreEl.textContent = highScore.toString();
};

// GAME OVER
const gameOver = () => {
  clearInterval(gameLoop);
  isPlaying = false;
  alert("Game Over!");
};

// GAME LOOP
const gameTick = () => {
  if (!isValidMove(currentPiece, currentX, currentY + 1)) {
    placePiece();
  } else {
    currentY++;
  }
  draw();
};

// GAME CONTROLS
const moveDown = () => {
  if (isValidMove(currentPiece, currentX, currentY + 1)) {
    currentY++;
    draw();
  }
};
const moveLeft = () => {
  if (isValidMove(currentPiece, currentX - 1, currentY)) {
    currentX--;
    draw();
  }
};
const moveRight = () => {
  if (isValidMove(currentPiece, currentX + 1, currentY)) {
    currentX++;
    draw();
  }
};
const rotateLeft = () => {
  const rotated = rotatePiece(rotatePiece(rotatePiece(currentPiece)));
  if (isValidMove(rotated, currentX, currentY)) {
    currentPiece = rotated;
    draw();
  }
};
const rotateRight = () => {
  const rotated = rotatePiece(currentPiece);
  if (isValidMove(rotated, currentX, currentY)) {
    currentPiece = rotated;
    draw();
  }
};
const dropPiece = () => {
  while (isValidMove(currentPiece, currentX, currentY + 1)) {
    currentY++;
  }
  placePiece();
  draw();
};

// GAME STATE
const playGame = () => {
  if (!isPlaying) {
    isPlaying = true;
    if (!isInitialized) {
      if (!initGame()) {
        isPlaying = false;
        return;
      }
    }
    gameLoop = setInterval(gameTick, 500);
  }
};
const pauseGame = () => {
  if (isPlaying) {
    clearInterval(gameLoop);
    isPlaying = false;
  }
};
const stopGame = () => {
  clearInterval(gameLoop);
  isPlaying = false;

  if (!isInitialized) return;

  resetGrid();
  score = 0;
  updateScore();
  spawnPiece();
  draw();
};

export {
  moveDown,
  moveLeft,
  moveRight,
  rotateLeft,
  rotateRight,
  dropPiece,
  playGame,
  pauseGame,
  stopGame,
};
