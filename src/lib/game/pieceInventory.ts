import type { PieceType } from "@/types/chess";

/** The most of each piece type one colour has in a standard set. */
export const STANDARD_INVENTORY: Readonly<Record<PieceType, number>> = {
  pawn: 8,
  knight: 2,
  bishop: 2,
  rook: 2,
  queen: 1,
  king: 1,
};
