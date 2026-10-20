import { parseCountryCode, type CountryCode } from "@/lib/leaderboard/countries";
import { compareRanking, parseScore, type RankingScore } from "@/lib/leaderboard/ranking";
import { entryFromRow } from "@/lib/leaderboard/entryRow";
import { isEntryId } from "@/lib/leaderboard/standing";
import { parseUtcDay } from "./daily";
import { isObject } from "./guards";
import { BLINDFOLD_MODE } from "@/lib/game/roundLink";
import { DAILY_BOARD, LEADERBOARD_DIFFICULTIES, type LeaderboardDifficulty } from "@/types/leaderboard";

export const ENTRIES_KEY = "memory-chess-lab-entries";

/** One entry per day: a round finished after midnight UTC still joins the board of the day before. */
export const DAILY_ENTRY_KEY = "memory-chess-daily-entry";

interface EntryFacts {
  readonly id: string;
  readonly country: CountryCode;
  readonly score: RankingScore;
  readonly submittedAt: number;
}

/** `mode` is absent on a board-study entry, as it is on every entry stored before blindfold boards existed. */
export interface StoredEntry extends EntryFacts {
  readonly difficulty: LeaderboardDifficulty;
  readonly mode?: typeof BLINDFOLD_MODE;
}

export interface DailyEntry extends EntryFacts {
  readonly difficulty: typeof DAILY_BOARD;
  readonly dailyDay: string;
}

/** Each ranked board keeps its own entry: a board-study one under its difficulty, a blindfold one beside it. */
export type EntryKey = LeaderboardDifficulty | `${typeof BLINDFOLD_MODE}-${LeaderboardDifficulty}`;

export type StoredEntries = Readonly<Partial<Record<EntryKey, StoredEntry>>>;

type Board = Pick<StoredEntry, "difficulty" | "mode">;

export const entryKey = ({ difficulty, mode }: Board): EntryKey => (mode ? `${mode}-${difficulty}` : difficulty);

export const ENTRY_BOARDS: readonly Board[] = LEADERBOARD_DIFFICULTIES.flatMap((difficulty) => [{ difficulty }, { difficulty, mode: BLINDFOLD_MODE }]);

function parseEntry(raw: unknown, { difficulty, mode }: Board): StoredEntry | null {
  if (!isObject(raw) || !isEntryId(raw.id) || raw.difficulty !== difficulty || raw.mode !== mode) return null;
  const score = parseScore(raw.score);
  const country = parseCountryCode(raw.country);
  if (score === null || country === null || !Number.isSafeInteger(raw.submittedAt)) return null;
  return { id: raw.id, difficulty, ...(mode && { mode }), country, score, submittedAt: raw.submittedAt as number };
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
  const kept = ENTRY_BOARDS.flatMap((board) => {
    const key = entryKey(board);
    const entry = parseEntry(raw[key], board);
    return entry ? [[key, entry] as const] : [];
  });
  return orNothing(Object.fromEntries(kept));
}

export function withEntry(entries: StoredEntries | null, entry: StoredEntry): StoredEntries {
  const key = entryKey(entry);
  const kept = entries?.[key];
  if (entries && kept && compareRanking(kept.score, entry.score) < 0) return entries;
  return { ...entries, [key]: entry };
}

export function withoutEntry(entries: StoredEntries | null, entry: StoredEntry): StoredEntries | null {
  const key = entryKey(entry);
  if (entries?.[key]?.id !== entry.id) return entries;
  return orNothing(Object.fromEntries(Object.entries(entries).filter(([kept]) => kept !== key)));
}

const DAILY_DAYS_KEPT = 2;

function parseDailyEntry(raw: unknown): DailyEntry | null {
  if (!isObject(raw) || !isEntryId(raw.id) || raw.difficulty !== DAILY_BOARD) return null;
  const dailyDay = parseUtcDay(raw.dailyDay);
  const score = parseScore(raw.score);
  const country = parseCountryCode(raw.country);
  if (dailyDay === null || score === null || country === null || !Number.isSafeInteger(raw.submittedAt)) return null;
  return { id: raw.id, difficulty: DAILY_BOARD, dailyDay, country, score, submittedAt: raw.submittedAt as number };
}

function parseDailyEntries(text: string | null): readonly DailyEntry[] {
  if (text === null) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  return Array.isArray(raw) ? raw.flatMap((item) => parseDailyEntry(item) ?? []) : [];
}

const withDailyEntry = (entries: readonly DailyEntry[], entry: DailyEntry): readonly DailyEntry[] =>
  [entry, ...entries.filter(({ dailyDay }) => dailyDay !== entry.dailyDay)].sort((a, b) => b.dailyDay.localeCompare(a.dailyDay)).slice(0, DAILY_DAYS_KEPT);

export function readDailyEntry(day: string): DailyEntry | null {
  try {
    return parseDailyEntries(window.localStorage.getItem(DAILY_ENTRY_KEY)).find(({ dailyDay }) => dailyDay === day) ?? null;
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
      entry.difficulty === DAILY_BOARD
        ? [DAILY_ENTRY_KEY, withDailyEntry(parseDailyEntries(window.localStorage.getItem(DAILY_ENTRY_KEY)), entry)]
        : [ENTRIES_KEY, withEntry(parseEntries(window.localStorage.getItem(ENTRIES_KEY)), entry)];
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kept for this page only.
  }
  return entry;
}
