import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import { compareRanking, parseScore, type RankingScore } from "@/lib/leaderboard/ranking";
import { parseBoard } from "@/lib/leaderboard/board";
import { isEntryId } from "@/lib/leaderboard/standing";
import { parseUtcDay } from "./daily";
import { isObject } from "./guards";
import { DAILY_BOARD, LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";

export const ENTRIES_KEY = "memory-chess-lab-entries";

/** One entry, the latest day's: each daily board is its own day, so an entry from another day never competes with it. */
export const DAILY_ENTRY_KEY = "memory-chess-daily-entry";

interface EntryFacts {
  readonly id: string;
  readonly country: CountryCode;
  readonly score: RankingScore;
  readonly submittedAt: number;
}

export interface StoredEntry extends EntryFacts {
  readonly difficulty: LeaderboardDifficulty;
}

export interface DailyEntry extends EntryFacts {
  readonly difficulty: typeof DAILY_BOARD;
  readonly dailyDay: string;
}

export type StoredEntries = Readonly<Partial<Record<LeaderboardDifficulty, StoredEntry>>>;

export function entryFromRow(row: unknown, submittedAt: number): StoredEntry | DailyEntry | null {
  if (!isObject(row) || !isEntryId(row.id)) return null;
  const board = parseBoard(row.difficulty, row.daily_day);
  if (board === null) return null;
  const score = parseScore({
    correctPieces: row.correct_pieces,
    totalWrongPieces: row.total_wrong_pieces ?? null,
    memorizeTime: row.memorize_time,
    solutionTime: row.solution_time,
  });
  if (score === null) return null;
  const country = row.country_code === undefined ? WORLD_CODE : parseCountryCode(row.country_code);
  if (country === null) return null;
  const facts = { id: row.id, country, score, submittedAt };
  return board.difficulty === DAILY_BOARD ? { ...facts, difficulty: DAILY_BOARD, dailyDay: board.daily_day } : { ...facts, difficulty: board.difficulty };
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

function parseDailyEntry(text: string | null): DailyEntry | null {
  if (text === null) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(raw) || !isEntryId(raw.id) || raw.difficulty !== DAILY_BOARD) return null;
  const dailyDay = parseUtcDay(raw.dailyDay);
  const score = parseScore(raw.score);
  const country = parseCountryCode(raw.country);
  if (dailyDay === null || score === null || country === null || !Number.isSafeInteger(raw.submittedAt)) return null;
  return { id: raw.id, difficulty: DAILY_BOARD, dailyDay, country, score, submittedAt: raw.submittedAt as number };
}

export function readDailyEntry(day: string): DailyEntry | null {
  try {
    const entry = parseDailyEntry(window.localStorage.getItem(DAILY_ENTRY_KEY));
    return entry?.dailyDay === day ? entry : null;
  } catch {
    return null;
  }
}

/** Storage refusing the write keeps nothing; the score is on the board either way. */
export function rememberEntry(row: unknown, now: number): StoredEntry | DailyEntry | null {
  const entry = entryFromRow(row, now);
  if (entry === null) return null;
  try {
    const [key, value] =
      entry.difficulty === DAILY_BOARD ? [DAILY_ENTRY_KEY, entry] : [ENTRIES_KEY, withEntry(parseEntries(window.localStorage.getItem(ENTRIES_KEY)), entry)];
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kept for this page only.
  }
  return entry;
}
