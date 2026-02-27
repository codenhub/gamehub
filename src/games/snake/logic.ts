export type Point = { x: number; y: number };

export const TILE_SIZE = 20;

/**
 * Checks if a requested direction is the exact opposite of the current one.
 * Prevents the snake from reversing into itself.
 */
export function isReverseDirection(current: Point, next: Point): boolean {
  if (next.x !== 0 && current.x !== 0) return true;
  if (next.y !== 0 && current.y !== 0) return true;
  return false;
}

interface MoveHeadParams {
  head: Point;
  direction: Point;
  tileSize: number;
}

export function moveHead({ head, direction, tileSize }: MoveHeadParams): Point {
  return {
    x: head.x + direction.x * tileSize,
    y: head.y + direction.y * tileSize,
  };
}

interface WallCollisionParams {
  point: Point;
  width: number;
  height: number;
}

export function isWallCollision({
  point,
  width,
  height,
}: WallCollisionParams): boolean {
  return point.x < 0 || point.x >= width || point.y < 0 || point.y >= height;
}

export function isSelfCollision(head: Point, body: Point[]): boolean {
  return body.some((s) => s.x === head.x && s.y === head.y);
}

export function isGridFull(
  snakeLength: number,
  cols: number,
  rows: number,
): boolean {
  return snakeLength >= cols * rows;
}

interface FindEmptyTileParams {
  cols: number;
  rows: number;
  tileSize: number;
  occupied: Set<string>;
}

/**
 * Finds the first available empty tile in the grid, starting from (0,0).
 * Used as a fallback for food spawning.
 */
export function findFirstEmptyTile({
  cols,
  rows,
  tileSize,
  occupied,
}: FindEmptyTileParams): Point | null {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = x * tileSize;
      const py = y * tileSize;
      if (!occupied.has(`${px},${py}`)) {
        return { x: px, y: py };
      }
    }
  }
  return null;
}
