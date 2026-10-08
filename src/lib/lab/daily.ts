import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { byEndedAt } from "./sessions";
import { streakOf, type StreakValue } from "./streak";
import type { RoundRecord, RoundRecordV2, SquareOutcome } from "./record";

/** Everyone plays the same board at the Medium preset. */
export const DAILY_SETTING = { pieceCount: DEFAULT_PRESET.pieceCount, memorizeTime: DEFAULT_PRESET.memorizeTime } as const;

/** The board changes at midnight UTC, so the whole world shares one board and one reset moment. */
export const utcDayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

export function msToNextUtcDay(at: number): number {
  const date = new Date(at);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1) - at;
}

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

export function readDailyOpened(): string | null {
  try {
    return window.localStorage.getItem(DAILY_OPENED_KEY);
  } catch {
    return null;
  }
}

export function dailyBoardOf(records: readonly RoundRecord[], day: string, openedDay: string | null): DailyBoard {
  const daily = records.filter(isDaily);
  const [round] = byEndedAt(daily.filter(({ dailyDay }) => dailyDay === day));
  const streak = (days: readonly string[]) => streakOf(days, day);
  const days = [...new Set(daily.map(({ dailyDay }) => dailyDay))];
  if (round) return { status: "played", day, round, streak: streak(days) };
  return { status: openedDay === day ? "unfinished" : "open", day, streak: days.length > 0 ? streak(days) : null };
}

/** Squares only, never pieces, so a pasted grid shows how the board went without naming what stood where. */
export const SHARE_CELLS: Readonly<Record<SquareOutcome, string>> = { ".": "⬜", c: "🟩", w: "🟨", m: "🟥", x: "🟧" };

export function shareGrid(squares: string): string {
  const cells = [...squares].map((outcome) => SHARE_CELLS[outcome as SquareOutcome]);
  return Array.from({ length: 8 }, (_, row) => cells.slice(row * 8, row * 8 + 8).join("")).join("\n");
}
