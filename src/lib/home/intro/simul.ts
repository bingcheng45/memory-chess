import type { SquareName } from "@/lib/game/board";

/** A piece as a FEN letter: upper case is White. */
export type SimulPiece = "K" | "Q" | "R" | "B" | "N" | "P" | "k" | "q" | "r" | "b" | "n" | "p";

/** One square after a move: the piece now on it, or null once it is empty. */
export type SimulChange = readonly [SquareName, SimulPiece | null];

/** A move and every square it changes, so castling, en passant and promotion are already resolved. */
export interface SimulPly {
  readonly san: string;
  readonly changes: readonly SimulChange[];
}

export interface SimulBoard {
  readonly name: string;
  /** The position the board shows on the intro's first frame. */
  readonly fen: string;
  readonly plies: readonly SimulPly[];
}
