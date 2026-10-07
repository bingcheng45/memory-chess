import { FILES, RANKS, type SquareName } from "@/lib/game/board";

// Board units: an overlay's viewBox is the 8x8 board, one unit per square.
export const fileOf = (square: SquareName) => FILES.indexOf(square[0] as (typeof FILES)[number]);
export const rowOf = (square: SquareName) => RANKS.indexOf(square[1] as (typeof RANKS)[number]);

export const squareCenter = (square: SquareName) => ({ x: fileOf(square) + 0.5, y: rowOf(square) + 0.5 });
