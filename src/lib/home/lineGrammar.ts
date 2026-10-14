import type { SquareName } from "@/lib/game/board";
import type { RelationKind } from "./relations";

/**
 * Every line drawn on a home-page board, by what it means. A relation between
 * two pieces, a move that was played, or the road a pawn has left to promotion.
 */
export type LineKind = RelationKind | "move" | "path";

export interface LineStyle {
  /** The colour says what kind of thing the line is about. */
  readonly tone: "ink" | "attack" | "defend" | "neutral";
  readonly stroke: "solid" | "dashed" | "dotted";
  readonly weight: "regular" | "thin";
  /** How the line meets its target: a head, nothing, or a bar the piece cannot pass. */
  readonly end: "head" | "none" | "bar";
}

/**
 * The one visual grammar for board lines. Ink is the game itself (solid for a
 * move made, dashed for a road still open), orange and blue are one piece acting
 * on another, grey is reach or a link with no direction.
 */
export const LINE_GRAMMAR: { readonly [Kind in LineKind]: LineStyle } = {
  move: { tone: "ink", stroke: "solid", weight: "regular", end: "head" },
  path: { tone: "ink", stroke: "dashed", weight: "regular", end: "head" },
  attacks: { tone: "attack", stroke: "solid", weight: "regular", end: "head" },
  defends: { tone: "defend", stroke: "solid", weight: "regular", end: "head" },
  controls: { tone: "neutral", stroke: "dotted", weight: "thin", end: "head" },
  chain: { tone: "neutral", stroke: "solid", weight: "thin", end: "none" },
  blocked: { tone: "ink", stroke: "solid", weight: "regular", end: "bar" },
};

/** The order a legend lists the kinds in. */
export const LINE_KINDS: readonly LineKind[] = ["move", "path", "attacks", "defends", "controls", "chain", "blocked"];

export interface BoardLine {
  readonly kind: LineKind;
  readonly from: SquareName;
  readonly to: SquareName;
}
