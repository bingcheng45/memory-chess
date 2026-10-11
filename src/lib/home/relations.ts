import type { SquareName } from "@/lib/game/board";

/**
 * What one piece does to a square. Every relation the homepage draws is checked
 * against chess.js in relations.test.ts, so an arrow can never claim a move the
 * position does not have.
 *
 * - attacks: the piece hits an enemy piece on the square.
 * - defends: the piece guards a piece of its own colour on the square.
 * - controls: the piece covers the empty square.
 * - chain: a pawn guards a pawn of its own colour.
 * - blocked: two pawns of opposite colours stand nose to nose on one file.
 */
export type RelationKind = "attacks" | "defends" | "controls" | "chain" | "blocked";

export interface Relation {
  readonly kind: RelationKind;
  readonly from: SquareName;
  readonly to: SquareName;
}

/** Pieces held as one idea: the squares they stand on and what ties them together. */
export interface Group<Id extends string> {
  readonly id: Id;
  /** Which colour the outline takes: a group of one side, or pieces of both. */
  readonly side: "white" | "black" | "mixed";
  readonly squares: readonly SquareName[];
  readonly relations: readonly Relation[];
}

/** A relation re-derived on a rebuilt board: does it still hold there? */
export interface RelationCheck {
  readonly relation: Relation;
  readonly holds: boolean;
}

export const relation = (kind: RelationKind, from: SquareName, to: SquareName): Relation => ({ kind, from, to });
