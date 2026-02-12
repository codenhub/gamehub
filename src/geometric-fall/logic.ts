export type PieceMatrix = number[][];

export const ROWS = 20;
export const COLS = 10;

export const TETROMINOES: Record<string, PieceMatrix> = {
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

export function createEmptyGrid(
  rows: number = ROWS,
  cols: number = COLS,
): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function rotatePiece(piece: PieceMatrix): PieceMatrix {
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
}

interface MoveValidation {
  grid: number[][];
  piece: PieceMatrix;
  x: number;
  y: number;
}

export function isValidMove({ grid, piece, x, y }: MoveValidation): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (piece[py][px]) {
        const newX = x + px;
        const newY = y + py;
        if (
          newX < 0 ||
          newX >= cols ||
          newY >= rows ||
          (newY >= 0 && grid[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

interface ClearLinesResult {
  grid: number[][];
  linesCleared: number;
}

export function clearLines(grid: number[][]): ClearLinesResult {
  const cols = grid[0]?.length ?? 0;
  const filteredGrid = grid.filter((row) => !row.every((cell) => cell !== 0));
  const linesCleared = grid.length - filteredGrid.length;
  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array(cols).fill(0),
  );

  return {
    grid: [...emptyRows, ...filteredGrid],
    linesCleared,
  };
}
