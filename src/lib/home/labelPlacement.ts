import { FILES, RANKS, type SquareName } from "@/lib/game/board";

/** Board units: the overlay's viewBox is the 8x8 board, one unit per square, rank 8 at the top. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface Size {
  readonly width: number;
  readonly height: number;
}

const BOARD = 8;
const EDGE = 0.04;
// Clears the numbered badge that sits on a box's top-left corner.
const GAP = 0.16;

const fileOf = (square: SquareName) => FILES.indexOf(square[0] as (typeof FILES)[number]);
const rowOf = (square: SquareName) => RANKS.indexOf(square[1] as (typeof RANKS)[number]);

/** The smallest rectangle of whole squares that holds every square. */
export function squaresBox(squares: readonly SquareName[]): Rect {
  const files = squares.map(fileOf);
  const rows = squares.map(rowOf);
  const x = Math.min(...files);
  const y = Math.min(...rows);
  return { x, y, width: Math.max(...files) + 1 - x, height: Math.max(...rows) + 1 - y };
}

/** The occupied squares a rectangle overlaps. */
export function coveredSquares(rect: Rect, occupied: ReadonlySet<SquareName>): SquareName[] {
  return [...occupied].filter((square) => {
    const file = fileOf(square);
    const row = rowOf(square);
    return rect.x < file + 1 && rect.x + rect.width > file && rect.y < row + 1 && rect.y + rect.height > row;
  });
}

const insideBoard = ({ x, y, width, height }: Rect) =>
  x >= EDGE && y >= EDGE && x + width <= BOARD - EDGE && y + height <= BOARD - EDGE;

const clampX = (x: number, width: number) => Math.min(Math.max(x, EDGE), BOARD - width - EDGE);

/** Positions to try, best first: above, below, beside, then inside the box's top and bottom edge. */
function candidates(box: Rect, { width, height }: Size): Rect[] {
  const left = clampX(box.x, width);
  const right = clampX(box.x + box.width - width, width);
  const above = box.y - height - GAP;
  const below = box.y + box.height + GAP;
  const sideLeft = box.x - width - GAP;
  const sideRight = box.x + box.width + GAP;
  const spots: [number, number][] = [
    [left, above],
    [right, above],
    [left, below],
    [right, below],
    [sideLeft, box.y],
    [sideRight, box.y],
    [sideLeft, box.y + box.height - height],
    [sideRight, box.y + box.height - height],
    [left, box.y + GAP],
    [right, box.y + GAP],
    [left, box.y + box.height - height - GAP],
    [right, box.y + box.height - height - GAP],
  ];
  return spots.map(([x, y]) => ({ x, y, width, height }));
}

/**
 * Where a group's name label goes: the first candidate that sits fully on the board and covers no piece.
 * When every one covers something, the on-board candidate covering the fewest, so the label still shows.
 */
export function placeLabel(box: Rect, size: Size, occupied: ReadonlySet<SquareName>): Rect {
  const onBoard = candidates(box, size).filter(insideBoard);
  const open = onBoard.find((rect) => coveredSquares(rect, occupied).length === 0);
  if (open) return open;
  const least = onBoard.reduce<Rect | null>(
    (best, rect) =>
      !best || coveredSquares(rect, occupied).length < coveredSquares(best, occupied).length ? rect : best,
    null,
  );
  return least ?? { x: clampX(box.x, size.width), y: EDGE, ...size };
}
