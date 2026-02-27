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
import { createStore } from "../_core/storage";
import ThemeManager from "../_core/utils/theme";

AudioManager.loadMultipleSFX(["collect", "hit", "place", "fail"]);

const TARGET_COLS = 10;

type GeometricFallSchema = {
  highScore: number;
};

const store = createStore<GeometricFallSchema>("geometric-fall");

const getColors = () => {
  return {
    piece: ThemeManager.getColor("--color-primary"),
    background: ThemeManager.getColor("--color-foreground"),
    grid: ThemeManager.getColor("--color-border"),
    ghost: ThemeManager.getColor("--color-accent"),
  };
};

export type GameCallbacks = {
  onScoreUpdate: (score: number, highScore: number) => void;
  onGameOver: (finalScore: number) => void;
};

/**
 * Main class for the Geometric Fall game (Tetris-like).
 * Handles the game grid, falling pieces, line clearing, and rendering.
 */
export class GeometricFallGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private grid: number[][] = [];
  private currentPiece!: PieceMatrix;
  private currentX: number = 0;
  private currentY: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private gameLoop: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;

  private nextPiece!: PieceMatrix;
  private previewCanvases: HTMLCanvasElement[] = [];
  private previewCtxs: CanvasRenderingContext2D[] = [];
  private readonly PREVIEW_COLS = 6;
  private readonly PREVIEW_ROWS = 6;
  private blockSize: number = 30;
  private previewBlockSize: number = 30;
  private bag: string[] = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context");
    this.ctx = context;

    this.highScore = store.get("highScore") ?? 0;
    this.init();
  }

  private init() {
    const nextels = document.querySelectorAll(".next-canvas");
    this.previewCanvases = Array.from(nextels) as HTMLCanvasElement[];
    this.previewCtxs = this.previewCanvases
      .map((c) => c.getContext("2d"))
      .filter((c): c is CanvasRenderingContext2D => !!c);

    this.calculateDimensions();
    this.setupResizeObserver();
    this.setupThemeListener();

    this.resetGrid();
    this.spawnPiece();
    this.callbacks.onScoreUpdate(this.score, this.highScore);
    this.draw();
  }

  private calculateDimensions() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const style = getComputedStyle(container);
    const paddingX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const containerWidth = container.clientWidth - paddingX;
    const containerHeight = container.clientHeight - paddingY;

    this.blockSize = Math.floor(containerWidth / TARGET_COLS);
    if (this.blockSize < 1) this.blockSize = 1;

    const cols = TARGET_COLS;
    const rows = Math.floor(containerHeight / this.blockSize);

    setGridDimensions(cols, Math.max(rows, 1));

    this.canvas.width = COLS * this.blockSize;
    this.canvas.height = ROWS * this.blockSize;

    this.previewBlockSize = this.blockSize;
    this.previewCanvases.forEach((c) => {
      c.width = this.PREVIEW_COLS * this.previewBlockSize;
      c.height = this.PREVIEW_ROWS * this.previewBlockSize;
    });
  }

  private setupResizeObserver() {
    const container = this.canvas.parentElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      const oldCols = COLS;
      const oldRows = ROWS;

      this.calculateDimensions();

      if (oldCols !== COLS || oldRows !== ROWS) {
        const newGrid = createEmptyGrid();
        for (let y = 0; y < Math.min(oldRows, ROWS); y++) {
          for (let x = 0; x < Math.min(oldCols, COLS); x++) {
            if (this.grid[y]?.[x]) newGrid[y][x] = this.grid[y][x];
          }
        }
        this.grid = newGrid;

        if (this.currentPiece) {
          this.currentX = Math.min(
            this.currentX,
            COLS - this.currentPiece[0].length,
          );
          this.currentX = Math.max(this.currentX, 0);
          this.currentY = Math.min(this.currentY, ROWS - 1);
        }
      }

      this.draw();
      if (this.nextPiece && this.previewCtxs.length > 0) this.drawNextPiece();
    });

    this.resizeObserver.observe(container);
  }

  private setupThemeListener() {
    window.addEventListener("theme-changed", () => {
      this.draw();
      if (this.nextPiece && this.previewCtxs.length > 0) this.drawNextPiece();
    });
  }

  private resetGrid() {
    this.grid = createEmptyGrid();
  }

  private resetGame() {
    this.resetGrid();
    this.bag = [];
    this.score = 0;
    this.nextPiece = null as any;
    this.spawnPiece();
    this.updateScore();
  }

  private shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private refillBag() {
    const pieces = Object.keys(TETROMINOES);
    this.bag = [...pieces];
    this.shuffleArray(this.bag);
  }

  private getNextPieceFromBag(): PieceMatrix {
    if (this.bag.length === 0) this.refillBag();
    const key = this.bag.pop()!;
    return TETROMINOES[key];
  }

  private spawnPiece() {
    if (!this.nextPiece) {
      this.nextPiece = this.getNextPieceFromBag();
    }
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNextPieceFromBag();

    this.currentX =
      Math.floor(COLS / 2) - Math.floor(this.currentPiece[0].length / 2);
    this.currentY = 0;

    if (this.previewCtxs.length > 0) this.drawNextPiece();
  }

  private drawNextPiece() {
    const colors = getColors();
    this.previewCtxs.forEach((pCtx, i) => {
      const pCanvas = this.previewCanvases[i];
      pCtx.fillStyle = colors.background;
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      const pieceWidth = this.nextPiece[0].length * this.previewBlockSize;
      const pieceHeight = this.nextPiece.length * this.previewBlockSize;
      const updateX = (pCanvas.width - pieceWidth) / 2;
      const updateY = (pCanvas.height - pieceHeight) / 2;

      pCtx.fillStyle = colors.piece;
      pCtx.strokeStyle = colors.grid;
      for (let y = 0; y < this.nextPiece.length; y++) {
        for (let x = 0; x < this.nextPiece[y].length; x++) {
          if (this.nextPiece[y][x]) {
            pCtx.fillRect(
              updateX + x * this.previewBlockSize,
              updateY + y * this.previewBlockSize,
              this.previewBlockSize,
              this.previewBlockSize,
            );
            pCtx.strokeRect(
              updateX + x * this.previewBlockSize,
              updateY + y * this.previewBlockSize,
              this.previewBlockSize,
              this.previewBlockSize,
            );
          }
        }
      }
    });
  }

  private getGhostY(): number {
    let ghostY = this.currentY;
    while (this.isValidMove(this.currentPiece, this.currentX, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  private draw() {
    const colors = getColors();
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = colors.grid;
    for (let x = 0; x <= COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.blockSize, 0);
      this.ctx.lineTo(x * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.blockSize);
      this.ctx.lineTo(this.canvas.width, y * this.blockSize);
      this.ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.grid[y]?.[x]) {
          this.ctx.fillStyle = colors.piece;
          this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize,
            this.blockSize,
          );
          this.ctx.strokeRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize,
            this.blockSize,
          );
        }
      }
    }

    if (this.currentPiece) {
      const ghostY = this.getGhostY();
      this.ctx.fillStyle = colors.ghost;
      for (let y = 0; y < this.currentPiece.length; y++) {
        for (let x = 0; x < this.currentPiece[y].length; x++) {
          if (this.currentPiece[y][x]) {
            this.ctx.fillRect(
              (this.currentX + x) * this.blockSize,
              (ghostY + y) * this.blockSize,
              this.blockSize,
              this.blockSize,
            );
            this.ctx.strokeRect(
              (this.currentX + x) * this.blockSize,
              (ghostY + y) * this.blockSize,
              this.blockSize,
              this.blockSize,
            );
          }
        }
      }

      this.ctx.fillStyle = colors.piece;
      for (let y = 0; y < this.currentPiece.length; y++) {
        for (let x = 0; x < this.currentPiece[y].length; x++) {
          if (this.currentPiece[y][x]) {
            this.ctx.fillRect(
              (this.currentX + x) * this.blockSize,
              (this.currentY + y) * this.blockSize,
              this.blockSize,
              this.blockSize,
            );
            this.ctx.strokeRect(
              (this.currentX + x) * this.blockSize,
              (this.currentY + y) * this.blockSize,
              this.blockSize,
              this.blockSize,
            );
          }
        }
      }
    }
  }

  private isValidMove(piece: PieceMatrix, x: number, y: number): boolean {
    return checkMove({ grid: this.grid, piece, x, y });
  }

  private placePiece() {
    for (let y = 0; y < this.currentPiece.length; y++) {
      for (let x = 0; x < this.currentPiece[y].length; x++) {
        if (this.currentPiece[y][x]) {
          const gridY = this.currentY + y;
          const gridX = this.currentX + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            this.grid[gridY][gridX] = 1;
          }
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
    if (!this.isValidMove(this.currentPiece, this.currentX, this.currentY)) {
      this.handleGameOver();
    } else {
      AudioManager.playSFX("place");
    }
  }

  private clearLines() {
    const result = computeClearedLines(this.grid);
    this.grid = result.grid;
    if (result.linesCleared > 0) {
      const points = [0, 100, 300, 500, 800];
      this.score += points[result.linesCleared] || result.linesCleared * 200;
      this.updateScore();
      AudioManager.playSFX("collect");
    }
  }

  private updateScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      store.set("highScore", this.highScore);
    }
    this.callbacks.onScoreUpdate(this.score, this.highScore);
  }

  private handleGameOver() {
    this.stop();
    AudioManager.playSFX("fail");
    this.callbacks.onGameOver(this.score);
  }

  private gameTick = () => {
    if (
      !this.isValidMove(this.currentPiece, this.currentX, this.currentY + 1)
    ) {
      this.placePiece();
    } else {
      this.currentY++;
    }
    this.draw();
  };

  public moveDown() {
    if (this.isValidMove(this.currentPiece, this.currentX, this.currentY + 1)) {
      this.currentY++;
      this.draw();
    }
  }

  public moveLeft() {
    if (this.isValidMove(this.currentPiece, this.currentX - 1, this.currentY)) {
      this.currentX--;
      this.draw();
    }
  }

  public moveRight() {
    if (this.isValidMove(this.currentPiece, this.currentX + 1, this.currentY)) {
      this.currentX++;
      this.draw();
    }
  }

  public rotateLeft() {
    const rotated = rotatePiece(rotatePiece(rotatePiece(this.currentPiece)));
    if (this.isValidMove(rotated, this.currentX, this.currentY)) {
      this.currentPiece = rotated;
      this.draw();
    }
  }

  public rotateRight() {
    const rotated = rotatePiece(this.currentPiece);
    if (this.isValidMove(rotated, this.currentX, this.currentY)) {
      this.currentPiece = rotated;
      this.draw();
    }
  }

  public dropPiece() {
    while (
      this.isValidMove(this.currentPiece, this.currentX, this.currentY + 1)
    ) {
      this.currentY++;
    }
    AudioManager.playSFX("hit");
    this.placePiece();
    this.draw();
  }

  public start() {
    this.stop();
    this.isPlaying = true;
    this.gameLoop = setInterval(this.gameTick.bind(this), 500);
  }

  public resume() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.gameLoop = setInterval(this.gameTick.bind(this), 500);
    }
  }

  public pause() {
    if (this.isPlaying) {
      if (this.gameLoop) clearInterval(this.gameLoop);
      this.gameLoop = null;
      this.isPlaying = false;
    }
  }

  public stop() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    this.gameLoop = null;
    this.isPlaying = false;
    this.resetGame();
    this.draw();
  }

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.gameLoop) clearInterval(this.gameLoop);
  }
}
