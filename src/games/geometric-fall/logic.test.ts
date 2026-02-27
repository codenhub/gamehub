import { describe, it, expect } from "vitest";
import {
  rotatePiece,
  isValidMove,
  clearLines,
  createEmptyGrid,
  TETROMINOES,
  ROWS,
  COLS,
} from "./logic";

describe("rotatePiece", () => {
  it("should rotate T-piece clockwise", () => {
    const rotated = rotatePiece(TETROMINOES.T);

    // Original T:     Rotated (clockwise):
    //   .X.            .X.
    //   XXX            .XX
    //   ...            .X.
    expect(rotated).toEqual([
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ]);
  });

  it("should rotate I-piece from horizontal to vertical", () => {
    const rotated = rotatePiece(TETROMINOES.I);

    // Original I:     Rotated:
    //   ....           ..X.
    //   XXXX           ..X.
    //   ....           ..X.
    //   ....           ..X.
    expect(rotated).toEqual([
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]);
  });

  it("should keep O-piece unchanged after rotation", () => {
    expect(rotatePiece(TETROMINOES.O)).toEqual(TETROMINOES.O);
  });

  it("should return to original shape after 4 rotations", () => {
    const pieces = Object.values(TETROMINOES);

    pieces.forEach((original) => {
      let piece = original;
      for (let i = 0; i < 4; i++) {
        piece = rotatePiece(piece);
      }
      expect(piece).toEqual(original);
    });
  });

  it("should not mutate the original piece", () => {
    const original = TETROMINOES.T.map((row) => [...row]);
    rotatePiece(TETROMINOES.T);

    expect(TETROMINOES.T).toEqual(original);
  });
});

describe("isValidMove", () => {
  it("should allow placement on empty grid center", () => {
    const grid = createEmptyGrid();

    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 3, y: 0 })).toBe(true);
  });

  it("should allow piece flush against left wall", () => {
    const grid = createEmptyGrid();
    // T-piece row 1 has blocks at offsets 0,1,2 — at x=0, leftmost is 0 ✓
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 0, y: 0 })).toBe(true);
  });

  it("should reject piece past left wall", () => {
    const grid = createEmptyGrid();
    // At x=-1, row 1 offset 0 → newX = -1 (out of bounds)
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: -1, y: 0 })).toBe(
      false,
    );
  });

  it("should allow piece flush against right wall", () => {
    const grid = createEmptyGrid();
    // T-piece is 3 wide, at x=7: rightmost block at 7+2=9 < COLS(10) ✓
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 7, y: 0 })).toBe(true);
  });

  it("should reject piece past right wall", () => {
    const grid = createEmptyGrid();
    // At x=8: rightmost block at 8+2=10 >= COLS(10)
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 8, y: 0 })).toBe(false);
  });

  it("should reject piece past bottom", () => {
    const grid = createEmptyGrid();
    // T-piece has blocks in rows 0 and 1 — at y=ROWS-1, row 1 goes to ROWS
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 3, y: ROWS - 1 })).toBe(
      false,
    );
  });

  it("should allow piece flush against bottom", () => {
    const grid = createEmptyGrid();
    // At y=ROWS-2, row 1 blocks land at ROWS-1 (last valid row)
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 3, y: ROWS - 2 })).toBe(
      true,
    );
  });

  it("should allow piece partially above grid (entering from top)", () => {
    const grid = createEmptyGrid();
    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 3, y: -1 })).toBe(true);
  });

  it("should detect collision with a placed block", () => {
    const grid = createEmptyGrid();
    grid[5][5] = 1;

    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 4, y: 5 })).toBe(false);
  });

  it("should allow placement adjacent to a placed block without overlap", () => {
    const grid = createEmptyGrid();
    grid[5][5] = 1;

    expect(isValidMove({ grid, piece: TETROMINOES.T, x: 6, y: 4 })).toBe(true);
  });
});

describe("clearLines", () => {
  it("should return zero when no lines are full", () => {
    const grid = createEmptyGrid();
    grid[ROWS - 1][0] = 1;

    const result = clearLines(grid);

    expect(result.linesCleared).toBe(0);
    expect(result.grid).toHaveLength(ROWS);
  });

  it("should clear a single full line", () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < COLS; x++) {
      grid[ROWS - 1][x] = 1;
    }

    const result = clearLines(grid);

    expect(result.linesCleared).toBe(1);
    expect(result.grid).toHaveLength(ROWS);
    expect(result.grid[0].every((c) => c === 0)).toBe(true);
    expect(result.grid[ROWS - 1].every((c) => c === 0)).toBe(true);
  });

  it("should clear multiple full lines at once", () => {
    const grid = createEmptyGrid();
    for (let y = ROWS - 3; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        grid[y][x] = 1;
      }
    }

    const result = clearLines(grid);

    expect(result.linesCleared).toBe(3);
    // Entire grid should be empty since nothing else existed
    result.grid.forEach((row) => {
      expect(row.every((c) => c === 0)).toBe(true);
    });
  });

  it("should shift partial rows down after clearing", () => {
    const grid = createEmptyGrid();
    // Fill bottom row completely
    for (let x = 0; x < COLS; x++) {
      grid[ROWS - 1][x] = 1;
    }
    // Place a lone block one row above
    grid[ROWS - 2][3] = 1;

    const result = clearLines(grid);

    expect(result.linesCleared).toBe(1);
    // The lone block should have shifted down to the bottom row
    expect(result.grid[ROWS - 1][3]).toBe(1);
    // Its old position should now be empty
    expect(result.grid[ROWS - 2][3]).toBe(0);
  });

  it("should not mutate the original grid array", () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < COLS; x++) {
      grid[ROWS - 1][x] = 1;
    }
    const originalLength = grid.length;

    clearLines(grid);

    // Original grid dimensions unchanged
    expect(grid).toHaveLength(originalLength);
    // Original bottom row still full
    expect(grid[ROWS - 1].every((c) => c !== 0)).toBe(true);
  });
});

describe("createEmptyGrid", () => {
  it("should create grid with default dimensions", () => {
    const grid = createEmptyGrid();

    expect(grid).toHaveLength(ROWS);
    grid.forEach((row) => {
      expect(row).toHaveLength(COLS);
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

  it("should create independent rows (no shared references)", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1;

    expect(grid[1][0]).toBe(0);
  });

  it("should respect custom dimensions", () => {
    const grid = createEmptyGrid(5, 8);

    expect(grid).toHaveLength(5);
    grid.forEach((row) => {
      expect(row).toHaveLength(8);
    });
  });
});
