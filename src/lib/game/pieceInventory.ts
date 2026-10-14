import type { PieceType } from "@/types/chess";

export const STANDARD_INVENTORY: Readonly<Record<PieceType, number>> = {
  pawn: 8,
  knight: 2,
  bishop: 2,
  rook: 2,
  queen: 1,
  king: 1,
};
