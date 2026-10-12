import { DAY_MS } from "./readiness";
import { streakOf, type StreakValue } from "./streak";
import type { RoundRecord, RoundRecordV2, SquareOutcome } from "./record";

/** The board changes at midnight UTC, so the whole world shares one board and one reset moment. */
export const utcDayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

const DAY_FORMAT = /^(\d{4})-\d{2}-\d{2}$/;

/** Postgres's DATE has no year 0. */
export function parseUtcDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const format = DAY_FORMAT.exec(value);
  if (format === null || Number(format[1]) < 1) return null;
  const midnight = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(midnight) && utcDayOf(midnight) === value ? value : null;
}

export const msToNextUtcDay = (at: number): number => DAY_MS - (at % DAY_MS);

export type DailyRound = RoundRecordV2 & { readonly kind: "daily"; readonly dailyDay: string };

const isDaily = (record: RoundRecord): record is DailyRound => record.v === 2 && record.kind === "daily" && record.dailyDay !== undefined;

/**
 * One attempt a day, and opening the board is the attempt: a board opened and left without a result is unfinished, so
 * leaving and coming back never shows it twice. The first daily round of the day is the day's result.
 */
export type DailyBoard =
  | { readonly status: "open" | "unfinished"; readonly day: string; readonly streak: StreakValue | null }
  | { readonly status: "played"; readonly day: string; readonly round: DailyRound; readonly streak: StreakValue };

/**
 * The UTC day of the last daily board opened on this device, written when the round starts. Kept apart from the record
 * on purpose: the record holds finished rounds only, and a board left before its result must still count as the try.
 */
export const DAILY_OPENED_KEY = "memory-chess-lab-daily-opened";

/** Storage events reach other tabs only, so the tab that opens the board announces it to itself. */
export const DAILY_OPENED_EVENT = "memory-chess-daily-opened";

export function readDailyOpened(): string | null {
  try {
    return window.localStorage.getItem(DAILY_OPENED_KEY);
  } catch {
    return null;
  }
}

export function dailyBoardOf(records: readonly RoundRecord[], day: string, openedDay: string | null): DailyBoard {
  const days = new Set<string>();
  let round: DailyRound | undefined;
  for (const record of records) {
    if (!isDaily(record)) continue;
    days.add(record.dailyDay);
    if (record.dailyDay === day && (!round || record.endedAt < round.endedAt)) round = record;
  }
  const streak = days.size > 0 ? streakOf([...days], day) : null;
  if (round && streak) return { status: "played", day, round, streak };
  return { status: openedDay === day ? "unfinished" : "open", day, streak };
}

/** Squares only, never pieces, so the grid shows how the board went without naming what stood where. */
export const OUTCOME_CELLS: Readonly<Record<SquareOutcome, string>> = { ".": "⬜", c: "🟩", w: "🟨", m: "🟥", x: "🟧" };

/** The player's own view of the board. Never copied: everyone plays the same board that day, so the squares would give it away. */
export function boardGrid(squares: string): string {
  const cells = [...squares].map((outcome) => OUTCOME_CELLS[outcome as SquareOutcome]);
  return Array.from({ length: 8 }, (_, row) => cells.slice(row * 8, row * 8 + 8).join("")).join("\n");
}

export const SHARE_ORDER = ["c", "w", "m", "x"] as const;

/** One cell per piece, sorted by outcome, so a pasted result carries how the try went and nothing about where. */
export function shareRow(squares: string): string {
  return SHARE_ORDER.map((outcome) => OUTCOME_CELLS[outcome].repeat([...squares].filter((square) => square === outcome).length)).join("");
}
