import { LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";
import { parseCountryCode, type CountryCode } from "./countries";
import { RANKING_ORDER, type RankingScore } from "./ranking";

export const STANDING_SCOPES = ["world", "country"] as const;
export type StandingScope = (typeof STANDING_SCOPES)[number];

/**
 * Where one leaderboard entry stands among every ranked entry on its difficulty, or only those from its own country.
 * Entries with the same score share a rank, so `rank` counts the entries strictly above plus one.
 */
export interface Standing {
  readonly difficulty: LeaderboardDifficulty;
  /** Null for the world. */
  readonly country: CountryCode | null;
  readonly rank: number;
  readonly total: number;
}

const ENTRY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEntryId = (value: unknown): value is string => typeof value === "string" && ENTRY_ID.test(value);

export const isStandingScope = (value: unknown): value is StandingScope => STANDING_SCOPES.includes(value as StandingScope);

/**
 * A PostgREST `or` filter for the rows that rank strictly above `score`, read from the same RANKING_ORDER the board
 * sorts by: better on the first key, or equal on it and better on the next, and so on. A null sorts last, so every
 * recorded value beats it and nothing beats it by being null too.
 */
export function rankedAboveFilter(score: RankingScore): string {
  const equal: string[] = [];
  const clauses: string[] = [];
  for (const { field, column, ascending } of RANKING_ORDER) {
    const value = score[field];
    const above = value === null ? `${column}.not.is.null` : `${column}.${ascending ? "lt" : "gt"}.${value}`;
    clauses.push(equal.length === 0 ? above : `and(${[...equal, above].join(",")})`);
    equal.push(value === null ? `${column}.is.null` : `${column}.eq.${value}`);
  }
  return clauses.join(",");
}

const isCount = (value: unknown, min: number): value is number => Number.isSafeInteger(value) && (value as number) >= min;

/** The rank endpoint's `data`, or null for anything else, so a changed or damaged reply never reads as a rank. */
export function parseStanding(value: unknown): Standing | null {
  if (typeof value !== "object" || value === null) return null;
  const { difficulty, country, rank, total } = value as Record<string, unknown>;
  if (!LEADERBOARD_DIFFICULTIES.includes(difficulty as LeaderboardDifficulty)) return null;
  if (!isCount(rank, 1) || !isCount(total, 1) || rank > total) return null;
  const code = country === null ? null : parseCountryCode(country);
  if (code === null && country !== null) return null;
  return { difficulty: difficulty as LeaderboardDifficulty, country: code, rank, total };
}
