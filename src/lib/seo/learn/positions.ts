/**
 * A chess position a guide states in its prose, and what the prose claims
 * about it. guideFacts.test.ts replays each one with chess.js.
 */

export type Side = "w" | "b";

/** A piece as colour plus lowercase type, such as "wq" or "bn". */
export type PieceCode = `${Side}${"k" | "q" | "r" | "b" | "n" | "p"}`;

export type PositionClaim =
  | { kind: "pieceCount"; count: number }
  /** Neither king is attacked. */
  | { kind: "noCheck" }
  | { kind: "check" }
  | { kind: "mate" }
  /** `piece` null means the square is empty. */
  | { kind: "occupant"; square: string; piece: PieceCode | null }
  | { kind: "legal"; move: string }
  | { kind: "illegal"; move: string }
  /** The piece on `from` attacks every one of `squares`. */
  | { kind: "attacks"; from: string; squares: string[] }
  /** Exactly these squares hold `side` pieces that attack `square`. */
  | { kind: "attackers"; square: string; side: Side; from: string[] }
  /** Exactly these squares hold `side` pieces the other side attacks. */
  | { kind: "attacked"; side: Side; squares: string[] }
  /** The piece on `square` has no legal move. */
  | { kind: "immobile"; square: string }
  /**
   * The side to move's legal replies. The non-king replies are exactly
   * `nonKing`, and after every reply `then` is legal and `undefended`, when
   * given, has no defender.
   */
  | { kind: "replies"; nonKing: string[]; then: string; undefended?: string }
  /** Sorted piece types each side has left, such as "kpppr". */
  | { kind: "material"; white: string; black: string }
  /** Exactly the squares the lone piece on `square` attacks. */
  | { kind: "reach"; square: string; squares: string[] }
  | { kind: "squareColour"; squares: string[]; colour: "light" | "dark" };

export type LearnPosition = {
  id: string;
  /** The guide section whose text states the position. */
  sectionId: string;
  /**
   * Pieces as "Kg1" style tokens, a bare square for a pawn. Absent for the
   * starting position.
   */
  white?: string[];
  black?: string[];
  toMove?: Side;
  /**
   * Squares of pieces added only to make the position legal. The prose
   * does not mention them, so the text check skips them.
   */
  unstated?: string[];
  /** Moves in SAN played before the claims are checked. */
  line?: string[];
  claims: PositionClaim[];
};
