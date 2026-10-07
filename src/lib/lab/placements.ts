import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";

/** [ms since the rebuild started, square index a8 = 0 as in `squares`, FEN piece letter]. */
export type PlacementEvent = readonly [ms: number, square: number, piece: string];

export const MAX_PLACEMENTS = 96;
export const MAX_PLACEMENT_MS = 60 * 60 * 1000;
export const MAX_REMOVALS = 10_000;

const PIECE_CODE = /^[KQRBNPkqrbnp]$/;
export const isPieceCode = (value: unknown): value is string => typeof value === "string" && PIECE_CODE.test(value);

export interface PlacementLog {
  readonly startedAt: number;
  readonly placements: readonly PlacementEvent[];
  /** Pieces lifted, swapped out or cleared off the board: the player's corrections. */
  readonly removals: number;
}

export function startPlacementLog(startedAt: number): PlacementLog {
  return { startedAt, placements: [], removals: 0 };
}

/**
 * Times never step back, even when the clock that stamped them did, so the
 * order of the events and the order of their times always agree. The log
 * holds only what the importer accepts, so one odd round cannot void a file.
 */
export function logPlacement(log: PlacementLog, at: number, square: SquareName, piece: string): PlacementLog {
  const index = BOARD_SQUARES.indexOf(square);
  if (log.placements.length >= MAX_PLACEMENTS || index < 0 || !isPieceCode(piece)) return log;
  const previous = log.placements.at(-1)?.[0] ?? 0;
  const ms = Math.min(MAX_PLACEMENT_MS, Math.max(previous, Math.round(at - log.startedAt)));
  return { ...log, placements: [...log.placements, [ms, index, piece]] };
}

export function logRemovals(log: PlacementLog, count = 1): PlacementLog {
  return count > 0 ? { ...log, removals: Math.min(MAX_REMOVALS, log.removals + count) } : log;
}
