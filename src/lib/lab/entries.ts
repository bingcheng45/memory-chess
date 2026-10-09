import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import { compareRanking, type RankingScore } from "@/lib/leaderboard/ranking";
import { isEntryId } from "@/lib/leaderboard/standing";
import { LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";

/**
 * The player's own leaderboard entries, one per difficulty, so the lab record can ask where they stand. Kept on this
 * device apart from the round log and its export; the server only ever sees an id when the player asks for a standing.
 */
export const ENTRIES_KEY = "memory-chess-lab-entries";

export interface StoredEntry {
  readonly id: string;
  readonly difficulty: LeaderboardDifficulty;
  /** The world code for an entry sent without a country, which then has only a world standing. */
  readonly country: CountryCode;
  readonly score: RankingScore;
  readonly submittedAt: number;
}

export type StoredEntries = Readonly<Partial<Record<LeaderboardDifficulty, StoredEntry>>>;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isDifficulty = (value: unknown): value is LeaderboardDifficulty => LEADERBOARD_DIFFICULTIES.includes(value as LeaderboardDifficulty);

function scoreOf(raw: Record<string, unknown>): RankingScore | null {
  const { correctPieces, totalWrongPieces, memorizeTime, solutionTime } = raw;
  if (!isNumber(correctPieces) || !isNumber(memorizeTime) || !isNumber(solutionTime)) return null;
  if (totalWrongPieces !== null && !isNumber(totalWrongPieces)) return null;
  return { correctPieces, totalWrongPieces, memorizeTime, solutionTime };
}

/** The row the leaderboard returned for a submission, or null for a reply this version cannot read. */
export function entryFromRow(row: unknown, submittedAt: number): StoredEntry | null {
  if (!isObject(row) || !isEntryId(row.id) || !isDifficulty(row.difficulty)) return null;
  const score = scoreOf({
    correctPieces: row.correct_pieces,
    totalWrongPieces: row.total_wrong_pieces ?? null,
    memorizeTime: row.memorize_time,
    solutionTime: row.solution_time,
  });
  if (score === null) return null;
  const country = row.country_code === undefined ? WORLD_CODE : parseCountryCode(row.country_code);
  if (country === null) return null;
  return { id: row.id, difficulty: row.difficulty, country, score, submittedAt };
}

function parseEntry(raw: unknown, difficulty: LeaderboardDifficulty): StoredEntry | null {
  if (!isObject(raw) || !isEntryId(raw.id) || raw.difficulty !== difficulty || !isObject(raw.score)) return null;
  const score = scoreOf(raw.score);
  const country = parseCountryCode(raw.country);
  if (score === null || country === null || !Number.isSafeInteger(raw.submittedAt)) return null;
  return { id: raw.id, difficulty, country, score, submittedAt: raw.submittedAt as number };
}

const orNothing = (entries: StoredEntries): StoredEntries | null => (Object.keys(entries).length > 0 ? entries : null);

/** Anything this version did not write is skipped one difficulty at a time, so a damaged value never hides the rest. */
export function parseEntries(text: string | null): StoredEntries | null {
  if (text === null) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(raw)) return null;
  const kept = LEADERBOARD_DIFFICULTIES.flatMap((difficulty) => {
    const entry = parseEntry(raw[difficulty], difficulty);
    return entry ? [[difficulty, entry] as const] : [];
  });
  return orNothing(Object.fromEntries(kept));
}

/** The best entry on each difficulty is the one whose standing means most; a newer entry wins a tie. */
export function withEntry(entries: StoredEntries | null, entry: StoredEntry): StoredEntries {
  const kept = entries?.[entry.difficulty];
  if (entries && kept && compareRanking(kept.score, entry.score) < 0) return entries;
  return { ...entries, [entry.difficulty]: entry };
}

export function withoutEntry(entries: StoredEntries, difficulty: LeaderboardDifficulty): StoredEntries | null {
  return orNothing(Object.fromEntries(Object.entries(entries).filter(([kept]) => kept !== difficulty)));
}

/** Called with the submit reply's `data`. A refused write leaves nothing stored, which reads as never submitted. */
export function rememberEntry(row: unknown, now: number): void {
  const entry = entryFromRow(row, now);
  if (entry === null) return;
  try {
    const stored = parseEntries(window.localStorage.getItem(ENTRIES_KEY));
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(withEntry(stored, entry)));
  } catch {
    // Storage refused: the standing check is unavailable on this device, and the score itself is already on the board.
  }
}
