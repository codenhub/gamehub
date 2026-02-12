export type Grid = number[][];
export type Direction = "up" | "down" | "left" | "right";
export type Cell = { row: number; col: number };

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

export function getEmptyCells(grid: Grid): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) cells.push({ row, col });
    }
  }
  return cells;
}

export function addRandomTile(grid: Grid): Grid {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;

  const newGrid = grid.map((row) => [...row]);
  const { row, col } = empty[Math.floor(Math.random() * empty.length)];
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;

  return newGrid;
}

interface SlideAndMergeResult {
  row: number[];
  score: number;
}

export function slideAndMergeRow(row: number[]): SlideAndMergeResult {
  // Remove zeros (slide left)
  const nonZero = row.filter((v) => v !== 0);

  // Merge adjacent equals
  const merged: number[] = [];
  let score = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedValue = nonZero[i] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      i++; // Skip next tile (already merged)
    } else {
      merged.push(nonZero[i]);
    }
  }

  // Pad with zeros on the right
  while (merged.length < row.length) {
    merged.push(0);
  }

  return { row: merged, score };
}

function extractRows(grid: Grid, direction: Direction): number[][] {
  const rows: number[][] = [];

  switch (direction) {
    case "left":
      for (let r = 0; r < GRID_SIZE; r++) {
        rows.push([...grid[r]]);
      }
      break;
    case "right":
      for (let r = 0; r < GRID_SIZE; r++) {
        rows.push([...grid[r]].reverse());
      }
      break;
    case "up":
      for (let c = 0; c < GRID_SIZE; c++) {
        rows.push(grid.map((row) => row[c]));
      }
      break;
    case "down":
      for (let c = 0; c < GRID_SIZE; c++) {
        rows.push(grid.map((row) => row[c]).reverse());
      }
      break;
  }

  return rows;
}

function insertRows(rows: number[][], direction: Direction): Grid {
  const grid = createEmptyGrid();

  switch (direction) {
    case "left":
      for (let r = 0; r < GRID_SIZE; r++) {
        grid[r] = rows[r];
      }
      break;
    case "right":
      for (let r = 0; r < GRID_SIZE; r++) {
        grid[r] = [...rows[r]].reverse();
      }
      break;
    case "up":
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE; r++) {
          grid[r][c] = rows[c][r];
        }
      }
      break;
    case "down":
      for (let c = 0; c < GRID_SIZE; c++) {
        const reversed = [...rows[c]].reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          grid[r][c] = reversed[r];
        }
      }
      break;
  }

  return grid;
}

interface MoveResult {
  grid: Grid;
  score: number;
  hasMoved: boolean;
}

export function moveGrid(grid: Grid, direction: Direction): MoveResult {
  const rows = extractRows(grid, direction);
  let totalScore = 0;

  const processed = rows.map((row) => {
    const result = slideAndMergeRow(row);
    totalScore += result.score;
    return result.row;
  });

  const newGrid = insertRows(processed, direction);

  const hasMoved = grid.some((row, r) =>
    row.some((val, c) => val !== newGrid[r][c]),
  );

  return { grid: newGrid, score: totalScore, hasMoved };
}

export function hasAvailableMoves(grid: Grid): boolean {
  // Check for any empty cell
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
    }
  }

  // Check for any adjacent equal pair
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = grid[r][c];
      if (c + 1 < GRID_SIZE && grid[r][c + 1] === val) return true;
      if (r + 1 < GRID_SIZE && grid[r + 1][c] === val) return true;
    }
  }

  return false;
}

export function hasWon(grid: Grid): boolean {
  return grid.some((row) => row.some((val) => val >= WIN_VALUE));
}
