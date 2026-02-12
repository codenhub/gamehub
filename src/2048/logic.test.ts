import { describe, it, expect } from "vitest";
import {
  createEmptyGrid,
  getEmptyCells,
  addRandomTile,
  slideAndMergeRow,
  moveGrid,
  hasAvailableMoves,
  hasWon,
  GRID_SIZE,
  WIN_VALUE,
} from "./logic";

describe("createEmptyGrid", () => {
  it("should create a grid with correct dimensions", () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => {
      expect(row).toHaveLength(GRID_SIZE);
    });
  });

  it("should fill all cells with 0", () => {
    const grid = createEmptyGrid();
    grid.forEach((row) => {
      row.forEach((cell) => {
        expect(cell).toBe(0);
      });
    });
  });

  it("should create independent rows", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1;
    expect(grid[1][0]).toBe(0);
  });
});

describe("getEmptyCells", () => {
  it("should return all cells on empty grid", () => {
    const grid = createEmptyGrid();
    const empty = getEmptyCells(grid);
    expect(empty).toHaveLength(GRID_SIZE * GRID_SIZE);
  });

  it("should return no cells on full grid", () => {
    const grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = 2;
      }
    }
    expect(getEmptyCells(grid)).toHaveLength(0);
  });

  it("should return only zero-value cells", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    grid[1][1] = 4;

    const empty = getEmptyCells(grid);
    expect(empty).toHaveLength(GRID_SIZE * GRID_SIZE - 2);
    expect(empty.some((c) => c.row === 0 && c.col === 0)).toBe(false);
    expect(empty.some((c) => c.row === 1 && c.col === 1)).toBe(false);
  });
});

describe("addRandomTile", () => {
  it("should place exactly one tile on empty grid", () => {
    const grid = createEmptyGrid();
    const result = addRandomTile(grid);

    const filledCells = result.flat().filter((v) => v !== 0);
    expect(filledCells).toHaveLength(1);
  });

  it("should only place a 2 or 4", () => {
    const grid = createEmptyGrid();
    const result = addRandomTile(grid);

    const value = result.flat().find((v) => v !== 0);
    expect([2, 4]).toContain(value);
  });

  it("should not mutate the original grid", () => {
    const grid = createEmptyGrid();
    addRandomTile(grid);
    expect(grid.flat().every((v) => v === 0)).toBe(true);
  });

  it("should return same grid when no empty cells", () => {
    const grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = 2;
      }
    }
    const result = addRandomTile(grid);
    expect(result).toBe(grid);
  });
});

describe("slideAndMergeRow", () => {
  it("should slide values to the left", () => {
    const result = slideAndMergeRow([0, 2, 0, 4]);
    expect(result.row).toEqual([2, 4, 0, 0]);
    expect(result.score).toBe(0);
  });

  it("should merge adjacent equal values", () => {
    const result = slideAndMergeRow([2, 2, 0, 0]);
    expect(result.row).toEqual([4, 0, 0, 0]);
    expect(result.score).toBe(4);
  });

  it("should not chain merges in same move", () => {
    const result = slideAndMergeRow([2, 2, 4, 0]);
    expect(result.row).toEqual([4, 4, 0, 0]);
    expect(result.score).toBe(4);
  });

  it("should merge first pair when three same values exist", () => {
    const result = slideAndMergeRow([2, 2, 2, 0]);
    expect(result.row).toEqual([4, 2, 0, 0]);
    expect(result.score).toBe(4);
  });

  it("should merge two pairs independently", () => {
    const result = slideAndMergeRow([2, 2, 4, 4]);
    expect(result.row).toEqual([4, 8, 0, 0]);
    expect(result.score).toBe(12);
  });

  it("should keep row unchanged when already packed", () => {
    const result = slideAndMergeRow([2, 4, 8, 16]);
    expect(result.row).toEqual([2, 4, 8, 16]);
    expect(result.score).toBe(0);
  });

  it("should handle all zeros", () => {
    const result = slideAndMergeRow([0, 0, 0, 0]);
    expect(result.row).toEqual([0, 0, 0, 0]);
    expect(result.score).toBe(0);
  });
});

describe("moveGrid", () => {
  it("should move tiles left correctly", () => {
    const grid = createEmptyGrid();
    grid[0] = [0, 0, 2, 2];

    const result = moveGrid(grid, "left");
    expect(result.grid[0]).toEqual([4, 0, 0, 0]);
    expect(result.score).toBe(4);
    expect(result.hasMoved).toBe(true);
  });

  it("should move tiles right correctly", () => {
    const grid = createEmptyGrid();
    grid[0] = [2, 2, 0, 0];

    const result = moveGrid(grid, "right");
    expect(result.grid[0]).toEqual([0, 0, 0, 4]);
    expect(result.score).toBe(4);
    expect(result.hasMoved).toBe(true);
  });

  it("should move tiles up correctly", () => {
    const grid = createEmptyGrid();
    grid[2][0] = 2;
    grid[3][0] = 2;

    const result = moveGrid(grid, "up");
    expect(result.grid[0][0]).toBe(4);
    expect(result.grid[1][0]).toBe(0);
    expect(result.grid[2][0]).toBe(0);
    expect(result.grid[3][0]).toBe(0);
    expect(result.hasMoved).toBe(true);
  });

  it("should move tiles down correctly", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    grid[1][0] = 2;

    const result = moveGrid(grid, "down");
    expect(result.grid[3][0]).toBe(4);
    expect(result.grid[0][0]).toBe(0);
    expect(result.hasMoved).toBe(true);
  });

  it("should report hasMoved false when nothing changes", () => {
    const grid = createEmptyGrid();
    grid[0] = [2, 4, 8, 16];

    const result = moveGrid(grid, "left");
    expect(result.hasMoved).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should not mutate the original grid", () => {
    const grid = createEmptyGrid();
    grid[0] = [0, 0, 2, 2];
    const original = grid[0].slice();

    moveGrid(grid, "left");
    expect(grid[0]).toEqual(original);
  });
});

describe("hasAvailableMoves", () => {
  it("should return true when empty cells exist", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    expect(hasAvailableMoves(grid)).toBe(true);
  });

  it("should return true when adjacent equal values exist", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 32],
    ];
    expect(hasAvailableMoves(grid)).toBe(true);
  });

  it("should return false when grid is full with no merges possible", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [2, 4, 8, 16],
      [32, 64, 128, 256],
    ];
    expect(hasAvailableMoves(grid)).toBe(false);
  });
});

describe("hasWon", () => {
  it("should return false when no tile reaches win value", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1024;
    expect(hasWon(grid)).toBe(false);
  });

  it("should return true when a tile reaches win value", () => {
    const grid = createEmptyGrid();
    grid[0][0] = WIN_VALUE;
    expect(hasWon(grid)).toBe(true);
  });

  it("should return true when a tile exceeds win value", () => {
    const grid = createEmptyGrid();
    grid[2][3] = WIN_VALUE * 2;
    expect(hasWon(grid)).toBe(true);
  });
});
