import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import { compareRanking, parseScore, type RankingScore } from "@/lib/leaderboard/ranking";
import { isEntryId } from "@/lib/leaderboard/standing";
import { isObject } from "./guards";
import { isLeaderboardDifficulty, LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";

export const ENTRIES_KEY = "memory-chess-lab-entries";

export interface StoredEntry {
  readonly id: string;
  readonly difficulty: LeaderboardDifficulty;
  readonly country: CountryCode;
  readonly score: RankingScore;
  readonly submittedAt: number;
}

export type StoredEntries = Readonly<Partial<Record<LeaderboardDifficulty, StoredEntry>>>;

export function entryFromRow(row: unknown, submittedAt: number): StoredEntry | null {
  if (!isObject(row) || !isEntryId(row.id) || !isLeaderboardDifficulty(row.difficulty)) return null;
  const score = parseScore({
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
  if (!isObject(raw) || !isEntryId(raw.id) || raw.difficulty !== difficulty) return null;
  const score = parseScore(raw.score);
  const country = parseCountryCode(raw.country);
  if (score === null || country === null || !Number.isSafeInteger(raw.submittedAt)) return null;
  return { id: raw.id, difficulty, country, score, submittedAt: raw.submittedAt as number };
}

const orNothing = (entries: StoredEntries): StoredEntries | null => (Object.keys(entries).length > 0 ? entries : null);

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

export function withEntry(entries: StoredEntries | null, entry: StoredEntry): StoredEntries {
  const kept = entries?.[entry.difficulty];
  if (entries && kept && compareRanking(kept.score, entry.score) < 0) return entries;
  return { ...entries, [entry.difficulty]: entry };
}

export function withoutEntry(entries: StoredEntries | null, { id, difficulty }: StoredEntry): StoredEntries | null {
  if (entries?.[difficulty]?.id !== id) return entries;
  return orNothing(Object.fromEntries(Object.entries(entries).filter(([kept]) => kept !== difficulty)));
}

/** False when the reply carries no entry or storage refuses the write; the score is on the board either way. */
export function rememberEntry(row: unknown, now: number): boolean {
  const entry = entryFromRow(row, now);
  if (entry === null) return false;
  try {
    const stored = parseEntries(window.localStorage.getItem(ENTRIES_KEY));
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(withEntry(stored, entry)));
    return true;
  } catch {
    return false;
  }
}
