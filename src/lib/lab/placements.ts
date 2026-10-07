import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";

/** [ms since the rebuild started, square index a8 = 0 as in `squares`, FEN piece letter]. */
export type PlacementEvent = readonly [ms: number, square: number, piece: string];

export const MAX_PLACEMENTS = 96;
export const MAX_PLACEMENT_MS = 60 * 60 * 1000;

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
 * order of the events and the order of their times always agree.
 */
export function logPlacement(log: PlacementLog, at: number, square: SquareName, piece: string): PlacementLog {
  if (log.placements.length >= MAX_PLACEMENTS) return log;
  const previous = log.placements.at(-1)?.[0] ?? 0;
  const ms = Math.min(MAX_PLACEMENT_MS, Math.max(previous, Math.round(at - log.startedAt)));
  return { ...log, placements: [...log.placements, [ms, BOARD_SQUARES.indexOf(square), piece]] };
}

export function logRemovals(log: PlacementLog, count = 1): PlacementLog {
  return count > 0 ? { ...log, removals: log.removals + count } : log;
}
