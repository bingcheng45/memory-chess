/**
 * A chess position a guide states in its prose, and what the prose claims
 * about it. guideFacts.test.ts replays each one with chess.js.
 */

import type { Square } from "chess.js";

export type Side = "w" | "b";

/** A piece as colour plus lowercase type, such as "wq" or "bn". */
export type PieceCode = `${Side}${"k" | "q" | "r" | "b" | "n" | "p"}`;

/** A piece as "Kg1" style token, a bare square for a pawn. */
export type PieceToken = `${"K" | "Q" | "R" | "B" | "N" | ""}${Square}`;

export type PositionClaim =
  | { kind: "pieceCount"; count: number }
  /** Neither king is attacked. */
  | { kind: "noCheck" }
  | { kind: "check" }
  | { kind: "mate" }
  /** `piece` null means the square is empty. */
  | { kind: "occupant"; square: Square; piece: PieceCode | null }
  | { kind: "legal"; move: string }
  | { kind: "illegal"; move: string }
  /** The piece on `from` attacks every one of `squares`. */
  | { kind: "attacks"; from: Square; squares: Square[] }
  /** Exactly these squares hold `side` pieces that attack `square`. */
  | { kind: "attackers"; square: Square; side: Side; from: Square[] }
  /** Exactly these squares hold `side` pieces the other side attacks. */
  | { kind: "attacked"; side: Side; squares: Square[] }
  /** The piece on `square` has no legal move. */
  | { kind: "immobile"; square: Square }
  /**
   * The side to move's legal replies. The non-king replies are exactly
   * `nonKing`, and after every reply `then` is legal and `undefended`, when
   * given, has no defender.
   */
  | { kind: "replies"; nonKing: string[]; then: string; undefended?: Square }
  /** Sorted piece types each side has left, such as "kpppr". */
  | { kind: "material"; white: string; black: string }
  /** Exactly the squares the lone piece on `square` attacks. */
  | { kind: "reach"; square: Square; squares: Square[] }
  | { kind: "squareColour"; squares: Square[]; colour: "light" | "dark" };

export type LearnPosition = {
  id: string;
  /** The guide section whose text states the position. */
  sectionId: string;
  /** Absent for the starting position. */
  white?: PieceToken[];
  black?: PieceToken[];
  toMove?: Side;
  /**
   * Squares of pieces added only to make the position legal. The prose
   * does not mention them, so the text check skips them.
   */
  unstated?: Square[];
  /** Moves in SAN played before the claims are checked. */
  line?: string[];
  claims: PositionClaim[];
};
