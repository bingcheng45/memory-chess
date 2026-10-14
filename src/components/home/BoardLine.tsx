import type { CSSProperties } from "react";
import type { SquareName } from "@/lib/game/board";
import { LINE_GRAMMAR, type BoardLine, type LineKind } from "@/lib/home/lineGrammar";
import { squareCenter } from "./boardUnits";

/** How far a line stays from the centre of a square holding a piece, so it never covers the glyph. */
const PIECE_GAP = 0.36;
const HEAD_LENGTH = 0.26;
const HEAD_HALF_WIDTH = 0.16;
// The shaft runs a little under the head, so its round cap never shows past the head's base.
const HEAD_OVERLAP = 0.06;
const BAR_HALF = 0.3;

interface Point {
  readonly x: number;
  readonly y: number;
}

export interface LineGeometry {
  readonly shaft: readonly [Point, Point];
  readonly head: readonly [Point, Point, Point] | null;
  readonly bar: readonly [Point, Point] | null;
}

/** The unit vector from one square's centre to another's, and their midpoint, in board units. */
export function direction(from: SquareName, to: SquareName) {
  const a = squareCenter(from);
  const z = squareCenter(to);
  const length = Math.hypot(z.x - a.x, z.y - a.y);
  return { a, z, length, ux: (z.x - a.x) / length, uy: (z.y - a.y) / length, mid: { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 } };
}

/**
 * Where a line runs. It always lies on the segment between the two square
 * centres; it starts at the centre of an empty square, or PIECE_GAP out from a
 * piece, and ends the same way. A bar end stops on the border the two squares share.
 */
export function lineGeometry({ kind, from, to }: BoardLine, occupied: ReadonlySet<SquareName>): LineGeometry {
  const { end } = LINE_GRAMMAR[kind];
  const { a, length, ux, uy, mid } = direction(from, to);
  const along = (distance: number): Point => ({ x: a.x + ux * distance, y: a.y + uy * distance });
  const across = (point: Point, half: number): readonly [Point, Point] => [
    { x: point.x - uy * half, y: point.y + ux * half },
    { x: point.x + uy * half, y: point.y - ux * half },
  ];
  const start = along(occupied.has(from) ? PIECE_GAP : 0);

  if (end === "bar") return { shaft: [start, mid], head: null, bar: across(mid, BAR_HALF) };
  const reach = length - (occupied.has(to) ? PIECE_GAP : 0);
  if (end === "none") return { shaft: [start, along(reach)], head: null, bar: null };
  const [left, right] = across(along(reach - HEAD_LENGTH), HEAD_HALF_WIDTH);
  return { shaft: [start, along(reach - HEAD_LENGTH + HEAD_OVERLAP)], head: [along(reach), left, right], bar: null };
}

const pointsOf = (points: readonly Point[]) => points.map(({ x, y }) => `${x},${y}`).join(" ");

interface LineMarkProps {
  line: BoardLine;
  /** Squares holding a piece: the line keeps clear of them. */
  occupied: ReadonlySet<SquareName>;
  className?: string;
  style?: CSSProperties;
}

/** One board line, drawn as LINE_GRAMMAR says its kind looks. */
export function LineMark({ line, occupied, className, style }: LineMarkProps) {
  const look = LINE_GRAMMAR[line.kind];
  const { shaft, head, bar } = lineGeometry(line, occupied);
  return (
    <g
      className={className ? `lab-line ${className}` : "lab-line"}
      data-kind={line.kind}
      data-tone={look.tone}
      data-stroke={look.stroke}
      data-weight={look.weight}
      style={style}
    >
      <line x1={shaft[0].x} y1={shaft[0].y} x2={shaft[1].x} y2={shaft[1].y} />
      {head && <polygon points={pointsOf(head)} />}
      {bar && <line className="lab-line-bar" x1={bar[0].x} y1={bar[0].y} x2={bar[1].x} y2={bar[1].y} />}
    </g>
  );
}

const NOTHING: ReadonlySet<SquareName> = new Set();

/** A one-square sample of a kind's line, for a legend. */
export function LineSwatch({ kind }: { kind: LineKind }) {
  return (
    <svg className="lab-line-swatch" viewBox="0.4 7.25 1.2 0.5" aria-hidden="true">
      <LineMark line={{ kind, from: "a1", to: "b1" }} occupied={NOTHING} />
    </svg>
  );
}
