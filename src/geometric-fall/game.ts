import {
  type PieceMatrix,
  ROWS,
  COLS,
  TETROMINOES,
  rotatePiece,
  isValidMove as checkMove,
  clearLines as computeClearedLines,
  createEmptyGrid,
  setGridDimensions,
} from "./logic";
import AudioManager from "../_core/audio";
import ThemeManager from "../_core/utils/theme";

AudioManager.loadMultipleSFX(["collect", "hit", "place", "fail"]);

// RENDERING CONSTANTS
const TARGET_COLS = 10;
const LOCAL_STORAGE_KEY = "geometric-fall-high-score";

const getColors = () => {
  return {
    piece: ThemeManager.getColor("--color-primary"),
    background: ThemeManager.getColor("--color-foreground"),
    grid: ThemeManager.getColor("--color-border"),
    ghost: ThemeManager.getColor("--color-accent"),
  };
};

// DYNAMIC SIZING
let blockSize = 30;
let previewBlockSize = 30;

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

// NEXT PIECE VARIABLES
let nextPiece: PieceMatrix;
let previewCanvases: HTMLCanvasElement[] = [];
let previewCtxs: CanvasRenderingContext2D[] = [];
const PREVIEW_COLS = 6;
const PREVIEW_ROWS = 6;

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

// CALCULATE DYNAMIC DIMENSIONS
const calculateDimensions = () => {
  const container = canvas.parentElement;
  if (!container) return;

  // Use content box (clientWidth - padding) to match the canvas CSS display size
  const style = getComputedStyle(container);
  const paddingX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const paddingY =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const containerWidth = container.clientWidth - paddingX;
  const containerHeight = container.clientHeight - paddingY;

  // Block size derived from available width and target columns
  blockSize = Math.floor(containerWidth / TARGET_COLS);
  if (blockSize < 1) blockSize = 1;

  const cols = TARGET_COLS;
  const rows = Math.floor(containerHeight / blockSize);

  setGridDimensions(cols, Math.max(rows, 1));

  canvas.width = COLS * blockSize;
  canvas.height = ROWS * blockSize;

  // Scale preview block size relative to game block size
  previewBlockSize = blockSize;
  previewCanvases.forEach((c) => {
    c.width = PREVIEW_COLS * previewBlockSize;
    c.height = PREVIEW_ROWS * previewBlockSize;
  });
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

  // Initialize Next Piece Canvas(es)
  const nextels = document.querySelectorAll(".next-canvas");
  previewCanvases = Array.from(nextels) as HTMLCanvasElement[];
  previewCtxs = previewCanvases
    .map((c) => c.getContext("2d"))
    .filter((c): c is CanvasRenderingContext2D => !!c);

  calculateDimensions();
  setupResizeObserver();
  setupThemeListener();

  resetGrid();
  // Reset nextPiece so spawnPiece does a proper double-spawn
  nextPiece = null as any;
  spawnPiece();
  updateScore();
  draw();
  isInitialized = true;
  return true;
};

const setupThemeListener = () => {
  window.addEventListener("theme-changed", () => {
    draw();
    if (nextPiece && previewCtxs.length > 0) drawNextPiece();
  });
};

// RESET GRID
const resetGrid = () => {
  grid = createEmptyGrid();
};

// SPAWN NEW PIECE
let bag: string[] = [];

// SHUFFLE ARRAY (Fisher-Yates)
const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// REFILL BAG
const refillBag = () => {
  const pieces = Object.keys(TETROMINOES);
  if (pieces.length === 0) {
    console.error("[GeometricFall] No tetrominoes defined");
    return;
  }
  bag = [...pieces];
  shuffleArray(bag);
};

// GET NEXT PIECE FROM BAG
const getNextPieceFromBag = (): PieceMatrix => {
  if (bag.length === 0) refillBag();

  const key = bag.pop();
  if (!key) {
    // Should not happen if refillBag works, but safety fallback
    const pieces = Object.keys(TETROMINOES);
    const randomKey = pieces[Math.floor(Math.random() * pieces.length)];
    return TETROMINOES[randomKey];
  }
  return TETROMINOES[key];
};

// SPAWN NEW PIECE
const spawnPiece = () => {
  if (!nextPiece) {
    nextPiece = getNextPieceFromBag();
  }

  currentPiece = nextPiece;
  nextPiece = getNextPieceFromBag();

  currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
  currentY = 0;

  if (previewCtxs.length > 0) drawNextPiece();
};

// DRAW NEXT PIECE PREVIEW
const drawNextPiece = () => {
  const colors = getColors();
  previewCtxs.forEach((pCtx, i) => {
    const pCanvas = previewCanvases[i];
    pCtx.fillStyle = colors.background;
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    // Calculate center offset
    const pieceWidth = nextPiece[0].length * previewBlockSize;
    const pieceHeight = nextPiece.length * previewBlockSize;
    const updateX = (pCanvas.width - pieceWidth) / 2;
    const updateY = (pCanvas.height - pieceHeight) / 2;

    pCtx.fillStyle = colors.piece;
    pCtx.strokeStyle = colors.grid;
    for (let y = 0; y < nextPiece.length; y++) {
      for (let x = 0; x < nextPiece[y].length; x++) {
        if (nextPiece[y][x]) {
          pCtx.fillRect(
            updateX + x * previewBlockSize,
            updateY + y * previewBlockSize,
            previewBlockSize,
            previewBlockSize,
          );
          pCtx.strokeRect(
            updateX + x * previewBlockSize,
            updateY + y * previewBlockSize,
            previewBlockSize,
            previewBlockSize,
          );
        }
      }
    }
  });
};

// GET GHOST Y
const getGhostY = (): number => {
  let ghostY = currentY;
  while (isValidMove(currentPiece, currentX, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
};

// DRAW GAME
const draw = () => {
  const colors = getColors();
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // DRAW GRID
  ctx.strokeStyle = colors.grid;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * blockSize, 0);
    ctx.lineTo(x * blockSize, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * blockSize);
    ctx.lineTo(canvas.width, y * blockSize);
    ctx.stroke();
  }

  // DRAW PLACED PIECES
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y]?.[x]) {
        ctx.fillStyle = colors.piece;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }

  // DRAW GHOST PIECE
  const ghostY = getGhostY();
  ctx.fillStyle = colors.ghost;
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        ctx.fillRect(
          (currentX + x) * blockSize,
          (ghostY + y) * blockSize,
          blockSize,
          blockSize,
        );
        ctx.strokeRect(
          (currentX + x) * blockSize,
          (ghostY + y) * blockSize,
          blockSize,
          blockSize,
        );
      }
    }
  }

  // DRAW CURRENT PIECE
  ctx.fillStyle = colors.piece;
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        ctx.fillRect(
          (currentX + x) * blockSize,
          (currentY + y) * blockSize,
          blockSize,
          blockSize,
        );
        ctx.strokeRect(
          (currentX + x) * blockSize,
          (currentY + y) * blockSize,
          blockSize,
          blockSize,
        );
      }
    }
  }
};

// CHECK COLLISION
const isValidMove = (piece: PieceMatrix, x: number, y: number): boolean =>
  checkMove({ grid, piece, x, y });

// PLACE PIECE
const placePiece = () => {
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        const gridY = currentY + y;
        const gridX = currentX + x;

        // Bounds safety
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
  } else {
    AudioManager.playSFX("place");
  }
};

// CLEAR LINES
const clearLines = () => {
  const result = computeClearedLines(grid);
  grid = result.grid;
  if (result.linesCleared > 0) {
    const points = [0, 100, 300, 500, 800];
    score += points[result.linesCleared] || result.linesCleared * 200;
    updateScore();
    AudioManager.playSFX("collect");
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
  AudioManager.playSFX("fail");
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
  AudioManager.playSFX("hit");
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
  bag = [];
  score = 0;
  updateScore();
  nextPiece = null as any; // Reset next piece
  spawnPiece();
  draw();
};

// RESIZE OBSERVER
let resizeObserver: ResizeObserver | null = null;

const setupResizeObserver = () => {
  const container = canvas.parentElement;
  if (!container) return;

  resizeObserver = new ResizeObserver(() => {
    const oldCols = COLS;
    const oldRows = ROWS;

    calculateDimensions();

    // Rebuild grid if dimensions changed, preserving existing placed blocks
    if (oldCols !== COLS || oldRows !== ROWS) {
      const newGrid = createEmptyGrid();
      for (let y = 0; y < Math.min(oldRows, ROWS); y++) {
        for (let x = 0; x < Math.min(oldCols, COLS); x++) {
          if (grid[y]?.[x]) newGrid[y][x] = grid[y][x];
        }
      }
      grid = newGrid;

      // Clamp current piece position to new bounds
      if (currentPiece) {
        currentX = Math.min(currentX, COLS - currentPiece[0].length);
        currentX = Math.max(currentX, 0);
        currentY = Math.min(currentY, ROWS - 1);
      }
    }

    draw();
    if (nextPiece && previewCtxs.length > 0) drawNextPiece();
  });

  resizeObserver.observe(container);
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
  updateScore,
};
