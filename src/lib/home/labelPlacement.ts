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
// Arrow lengths closer than this tie, so the candidate order decides.
const ARROW_EPSILON = 0.001;

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

export interface Point {
  readonly x: number;
  readonly y: number;
}
/** A straight line between two points in board units: an arrow's shaft. */
export interface Segment {
  readonly from: Point;
  readonly to: Point;
}

const centerOf = (square: SquareName): Point => ({ x: fileOf(square) + 0.5, y: rowOf(square) + 0.5 });

/** The segment between two squares' centres, which is where an arrow or relation line runs. */
export const segmentBetween = (from: SquareName, to: SquareName): Segment => ({ from: centerOf(from), to: centerOf(to) });

/** How much of the segments' total length lies inside the rectangle (Liang-Barsky clip). */
export function coveredLength(rect: Rect, segments: readonly Segment[]): number {
  return segments.reduce((total, { from, to }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let t0 = 0;
    let t1 = 1;
    const edges: [number, number][] = [
      [-dx, from.x - rect.x],
      [dx, rect.x + rect.width - from.x],
      [-dy, from.y - rect.y],
      [dy, rect.y + rect.height - from.y],
    ];
    for (const [p, q] of edges) {
      if (p === 0) {
        if (q < 0) return total;
        continue;
      }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
    return t1 > t0 ? total + (t1 - t0) * Math.hypot(dx, dy) : total;
  }, 0);
}

const insideBoard = ({ x, y, width, height }: Rect) =>
  x >= EDGE && y >= EDGE && x + width <= BOARD - EDGE && y + height <= BOARD - EDGE;

const clampX = (x: number, width: number) => Math.min(Math.max(x, EDGE), BOARD - width - EDGE);

/** Positions to try, best first: above, below, beside, inside the box's top and bottom edge, then inside it row by row. */
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
  for (let row = 0; row < box.height; row += 1) {
    const y = box.y + row + (1 - height) / 2;
    spots.push([left, y], [right, y]);
  }
  return spots.map(([x, y]) => ({ x, y, width, height }));
}

/**
 * Where a group's name label goes. Candidates are ranked by pieces covered, then by arrow length
 * covered, then by the order above, so a piece is never traded for an arrow. When every on-board
 * candidate covers something, the least-bad one still shows.
 */
export function placeLabel(
  box: Rect,
  size: Size,
  occupied: ReadonlySet<SquareName>,
  arrows: readonly Segment[] = [],
): Rect {
  const scored = candidates(box, size)
    .filter(insideBoard)
    .map((rect) => ({ rect, pieces: coveredSquares(rect, occupied).length, arrow: coveredLength(rect, arrows) }));
  const best = scored.reduce<(typeof scored)[number] | null>(
    (lead, next) =>
      !lead || next.pieces < lead.pieces || (next.pieces === lead.pieces && next.arrow < lead.arrow - ARROW_EPSILON)
        ? next
        : lead,
    null,
  );
  return best?.rect ?? { x: clampX(box.x, size.width), y: EDGE, ...size };
}
