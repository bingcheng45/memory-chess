import type { SquareName } from '@/lib/game/board';
import type { LabPiece, LabPosition } from '@/lib/round/round';
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from '@/lib/reference/facts';

export type StepDirection = 1 | -1;

/** Every second up to 10, where one second changes a round the most, then every 5. */
export const MEMORIZE_SECONDS_LADDER: readonly number[] = Array.from(
  { length: MEMORIZE_SECONDS_RANGE.max - MEMORIZE_SECONDS_RANGE.min + 1 },
  (_, index) => MEMORIZE_SECONDS_RANGE.min + index,
).filter((seconds) => seconds <= 10 || seconds % 5 === 0);

/** A saved time off the ladder, such as 18, steps to its neighbours on it: 20 up, 15 down. */
export function stepMemorizeTime(seconds: number, direction: StepDirection): number {
  const next =
    direction === 1
      ? MEMORIZE_SECONDS_LADDER.find((rung) => rung > seconds)
      : [...MEMORIZE_SECONDS_LADDER].reverse().find((rung) => rung < seconds);
  return next ?? seconds;
}

export function stepPieceCount(count: number, delta: number): number {
  return Math.min(PIECE_COUNT_RANGE.max, Math.max(PIECE_COUNT_RANGE.min, count + delta));
}

const piece = (color: LabPiece['color'], type: LabPiece['type']): LabPiece => ({ color, type });

/**
 * The setup card's board shows the first N of these. Kings come first so Easy (2) is just the kings, and all 32
 * make a quiet Italian Game after both sides castle.
 */
export const PREVIEW_PIECES: readonly (readonly [SquareName, LabPiece])[] = [
  ['g1', piece('white', 'king')],
  ['g8', piece('black', 'king')],
  ['d1', piece('white', 'queen')],
  ['d8', piece('black', 'queen')],
  ['f1', piece('white', 'rook')],
  ['f8', piece('black', 'rook')],
  ['a1', piece('white', 'rook')],
  ['a8', piece('black', 'rook')],
  ['c4', piece('white', 'bishop')],
  ['c5', piece('black', 'bishop')],
  ['f3', piece('white', 'knight')],
  ['f6', piece('black', 'knight')],
  ['b1', piece('white', 'knight')],
  ['c6', piece('black', 'knight')],
  ['c1', piece('white', 'bishop')],
  ['c8', piece('black', 'bishop')],
  ['e4', piece('white', 'pawn')],
  ['e5', piece('black', 'pawn')],
  ['d3', piece('white', 'pawn')],
  ['d6', piece('black', 'pawn')],
  ['c3', piece('white', 'pawn')],
  ['c7', piece('black', 'pawn')],
  ['f2', piece('white', 'pawn')],
  ['f7', piece('black', 'pawn')],
  ['g2', piece('white', 'pawn')],
  ['g7', piece('black', 'pawn')],
  ['h2', piece('white', 'pawn')],
  ['h7', piece('black', 'pawn')],
  ['b2', piece('white', 'pawn')],
  ['b7', piece('black', 'pawn')],
  ['a2', piece('white', 'pawn')],
  ['a7', piece('black', 'pawn')],
];

export const PREVIEW_POSITION: LabPosition = Object.fromEntries(PREVIEW_PIECES);

const PREVIEW_ORDER = new Map(PREVIEW_PIECES.map(([square], index) => [square, index]));

export const previewOrderOf = (square: SquareName): number | undefined => PREVIEW_ORDER.get(square);
