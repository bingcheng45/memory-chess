import { LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";

export interface RankingScore {
  correctPieces: number;
  totalWrongPieces: number | null;
  memorizeTime: number;
  solutionTime: number;
}

export type BoardCutoff =
  | { kind: "open" }
  | { kind: "full"; worst: RankingScore };

export type LeaderboardCutoffs = Record<LeaderboardDifficulty, BoardCutoff>;

export interface RankingKey {
  field: keyof RankingScore;
  column: string;
  ascending: boolean;
  /**
   * Sent to PostgREST only where the live query already sends it, which is the
   * one nullable column. Adding it to the others would change the wire request
   * for columns that are never null. It is never true: a null is always worse
   * than a recorded value.
   */
  nullsFirst?: false;
}

/** Shared source of truth: the SQL ORDER BY and compareRanking both read this table. */
export const RANKING_ORDER: readonly RankingKey[] = [
  { field: "correctPieces", column: "correct_pieces", ascending: false },
  {
    field: "totalWrongPieces",
    column: "total_wrong_pieces",
    ascending: true,
    nullsFirst: false,
  },
  { field: "memorizeTime", column: "memorize_time", ascending: true },
  { field: "solutionTime", column: "solution_time", ascending: true },
];

function compareValues(a: number | null, b: number | null, ascending: boolean): number {
  if (a === null || b === null) {
    if (a === b) {
      return 0;
    }
    return a === null ? 1 : -1;
  }
  if (a === b) {
    return 0;
  }
  const ordered = a < b ? -1 : 1;
  return ascending ? ordered : -ordered;
}

export function compareRanking(a: RankingScore, b: RankingScore): number {
  for (const key of RANKING_ORDER) {
    const ordered = compareValues(a[key.field], b[key.field], key.ascending);
    if (ordered !== 0) {
      return ordered;
    }
  }
  return 0;
}

export function qualifies(score: RankingScore, cutoff: BoardCutoff): boolean {
  if (cutoff.kind === "open") {
    return true;
  }
  return compareRanking(score, cutoff.worst) < 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseScore(value: unknown): RankingScore | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { correctPieces, totalWrongPieces, memorizeTime, solutionTime } = value as Record<
    string,
    unknown
  >;
  if (
    !isFiniteNumber(correctPieces) ||
    !isFiniteNumber(memorizeTime) ||
    !isFiniteNumber(solutionTime)
  ) {
    return null;
  }
  if (totalWrongPieces !== null && !isFiniteNumber(totalWrongPieces)) {
    return null;
  }
  return { correctPieces, totalWrongPieces, memorizeTime, solutionTime };
}

function parseCutoff(value: unknown): BoardCutoff | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { kind, worst } = value as Record<string, unknown>;
  if (kind === "open") {
    return { kind: "open" };
  }
  if (kind !== "full") {
    return null;
  }
  const parsed = parseScore(worst);
  return parsed === null ? null : { kind: "full", worst: parsed };
}

export function parseCutoffs(value: unknown): LeaderboardCutoffs | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const cutoffs = {} as LeaderboardCutoffs;
  for (const difficulty of LEADERBOARD_DIFFICULTIES) {
    const cutoff = parseCutoff(raw[difficulty]);
    if (cutoff === null) {
      return null;
    }
    cutoffs[difficulty] = cutoff;
  }
  return cutoffs;
}
