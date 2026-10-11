import type { CSSProperties } from "react";
import type { SquareName } from "@/lib/game/board";
import { squareCenter } from "./boardUnits";

const ARROW_TAIL = 0.28;
const ARROW_GAP = 0.3;
const HEAD_LENGTH = 0.24;
const HEAD_HALF_WIDTH = 0.15;
const HEAD_OVERLAP = 0.18;

interface BoardArrowProps {
  from: SquareName;
  to: SquareName;
  className: string;
  kind: string;
  /** A square a piece merely covers: a line with no head. */
  headless?: boolean;
  style?: CSSProperties;
}

/** The unit vector from one square's centre to another's, and their midpoint, in board units. */
export function direction(from: SquareName, to: SquareName) {
  const a = squareCenter(from);
  const z = squareCenter(to);
  const length = Math.hypot(z.x - a.x, z.y - a.y);
  return { a, z, ux: (z.x - a.x) / length, uy: (z.y - a.y) / length, mid: { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 } };
}

/** An arrow between two square centres, stopping short of both pieces. */
export function BoardArrow({ from, to, className, kind, headless = false, style }: BoardArrowProps) {
  const { a, z, ux, uy } = direction(from, to);
  const tip = { x: z.x - ux * ARROW_GAP, y: z.y - uy * ARROW_GAP };
  const end = headless ? tip : { x: tip.x - ux * HEAD_OVERLAP, y: tip.y - uy * HEAD_OVERLAP };
  const base = { x: tip.x - ux * HEAD_LENGTH, y: tip.y - uy * HEAD_LENGTH };
  const head = [
    `${tip.x},${tip.y}`,
    `${base.x - uy * HEAD_HALF_WIDTH},${base.y + ux * HEAD_HALF_WIDTH}`,
    `${base.x + uy * HEAD_HALF_WIDTH},${base.y - ux * HEAD_HALF_WIDTH}`,
  ].join(" ");

  return (
    <g className={className} data-kind={kind} style={style}>
      <line x1={a.x + ux * ARROW_TAIL} y1={a.y + uy * ARROW_TAIL} x2={end.x} y2={end.y} pathLength={1} />
      {!headless && <polygon points={head} />}
    </g>
  );
}
