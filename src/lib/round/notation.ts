import type { PieceColor, PieceType } from "@/types/chess";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { PIECE_TYPE_ORDER, type LabPosition } from "./round";

/** One side's pieces in algebraic notation, as "Ke1" or, for a pawn, the square alone. */
export interface SideNotation {
  readonly color: PieceColor;
  readonly pieces: readonly string[];
}

// The site writes piece names out in each language but never localises the letters, so these stay English.
const PIECE_LETTER: Readonly<Record<PieceType, string>> = { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N", pawn: "" };

const SIDES: readonly PieceColor[] = ["white", "black"];

const byFileThenRank = (a: SquareName, b: SquareName) => a.localeCompare(b);

/** White then Black, each king first, then queen, rooks, bishops, knights and pawns; a side with no pieces is left out. */
export function notationOf(position: LabPosition): readonly SideNotation[] {
  const occupied = BOARD_SQUARES.filter((square) => position[square]);
  return SIDES.flatMap((color) => {
    const pieces = PIECE_TYPE_ORDER.flatMap((type) =>
      occupied
        .filter((square) => position[square]?.color === color && position[square]?.type === type)
        .sort(byFileThenRank)
        .map((square) => `${PIECE_LETTER[type]}${square}`),
    );
    return pieces.length > 0 ? [{ color, pieces }] : [];
  });
}
