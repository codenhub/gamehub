import { describe, it, expect } from "vitest";
import {
  isReverseDirection,
  moveHead,
  isWallCollision,
  isSelfCollision,
  isGridFull,
  findFirstEmptyTile,
  TILE_SIZE,
} from "./logic";

describe("isReverseDirection", () => {
  it("should block horizontal reversal", () => {
    expect(isReverseDirection({ x: 1, y: 0 }, { x: -1, y: 0 })).toBe(true);
    expect(isReverseDirection({ x: -1, y: 0 }, { x: 1, y: 0 })).toBe(true);
  });

  it("should block vertical reversal", () => {
    expect(isReverseDirection({ x: 0, y: 1 }, { x: 0, y: -1 })).toBe(true);
    expect(isReverseDirection({ x: 0, y: -1 }, { x: 0, y: 1 })).toBe(true);
  });

  it("should allow perpendicular turns", () => {
    expect(isReverseDirection({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(false);
    expect(isReverseDirection({ x: 1, y: 0 }, { x: 0, y: -1 })).toBe(false);
    expect(isReverseDirection({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(false);
    expect(isReverseDirection({ x: 0, y: 1 }, { x: -1, y: 0 })).toBe(false);
  });

  it("should allow any direction from standstill", () => {
    expect(isReverseDirection({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(false);
    expect(isReverseDirection({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe(false);
  });
});

describe("moveHead", () => {
  it("should move right", () => {
    const result = moveHead({
      head: { x: 40, y: 60 },
      direction: { x: 1, y: 0 },
      tileSize: TILE_SIZE,
    });
    expect(result).toEqual({ x: 60, y: 60 });
  });

  it("should move up (negative y)", () => {
    const result = moveHead({
      head: { x: 40, y: 60 },
      direction: { x: 0, y: -1 },
      tileSize: TILE_SIZE,
    });
    expect(result).toEqual({ x: 40, y: 40 });
  });

  it("should not mutate the original head", () => {
    const head = { x: 40, y: 60 };
    moveHead({ head, direction: { x: 1, y: 0 }, tileSize: TILE_SIZE });
    expect(head).toEqual({ x: 40, y: 60 });
  });
});

describe("isWallCollision", () => {
  const bounds = { width: 200, height: 200 };

  it("should detect left wall collision", () => {
    expect(isWallCollision({ point: { x: -1, y: 50 }, ...bounds })).toBe(true);
  });

  it("should detect right wall collision", () => {
    expect(isWallCollision({ point: { x: 200, y: 50 }, ...bounds })).toBe(true);
  });

  it("should detect top wall collision", () => {
    expect(isWallCollision({ point: { x: 50, y: -1 }, ...bounds })).toBe(true);
  });

  it("should detect bottom wall collision", () => {
    expect(isWallCollision({ point: { x: 50, y: 200 }, ...bounds })).toBe(true);
  });

  it("should allow valid positions", () => {
    expect(isWallCollision({ point: { x: 0, y: 0 }, ...bounds })).toBe(false);
    expect(isWallCollision({ point: { x: 199, y: 199 }, ...bounds })).toBe(false);
  });
});

describe("isSelfCollision", () => {
  it("should detect collision with body segment", () => {
    const body = [
      { x: 20, y: 20 },
      { x: 40, y: 20 },
    ];
    expect(isSelfCollision({ x: 20, y: 20 }, body)).toBe(true);
  });

  it("should return false when no overlap", () => {
    const body = [
      { x: 20, y: 20 },
      { x: 40, y: 20 },
    ];
    expect(isSelfCollision({ x: 60, y: 20 }, body)).toBe(false);
  });

  it("should return false for empty body", () => {
    expect(isSelfCollision({ x: 20, y: 20 }, [])).toBe(false);
  });
});

describe("isGridFull", () => {
  it("should return true when snake fills the grid", () => {
    expect(isGridFull(100, 10, 10)).toBe(true);
  });

  it("should return true when snake exceeds grid", () => {
    expect(isGridFull(101, 10, 10)).toBe(true);
  });

  it("should return false when space remains", () => {
    expect(isGridFull(99, 10, 10)).toBe(false);
  });
});

describe("findFirstEmptyTile", () => {
  it("should find the first available tile", () => {
    const occupied = new Set(["0,0"]);
    const result = findFirstEmptyTile({
      cols: 3,
      rows: 3,
      tileSize: TILE_SIZE,
      occupied,
    });
    expect(result).toEqual({ x: 0, y: TILE_SIZE });
  });

  it("should return null when grid is full", () => {
    const occupied = new Set<string>();
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        occupied.add(`${x * TILE_SIZE},${y * TILE_SIZE}`);
      }
    }
    const result = findFirstEmptyTile({
      cols: 2,
      rows: 2,
      tileSize: TILE_SIZE,
      occupied,
    });
    expect(result).toBeNull();
  });

  it("should return (0,0) when grid is empty", () => {
    const result = findFirstEmptyTile({
      cols: 5,
      rows: 5,
      tileSize: TILE_SIZE,
      occupied: new Set(),
    });
    expect(result).toEqual({ x: 0, y: 0 });
  });
});
