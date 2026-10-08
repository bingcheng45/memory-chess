import { shiftDay } from "./engine";
import { daysBetween, LAB_THRESHOLDS } from "./readiness";

export type StreakDay = "played" | "forgiven" | "missed" | "today";

/** Played days in a run walked back from its last day. A forgiven day keeps the run going but is not counted. */
export interface StreakRun {
  readonly played: number;
  /** Newest first. */
  readonly forgivenDays: readonly string[];
}

export interface StreakValue {
  /** Days played in the run ending today, or yesterday if today has no round yet. */
  readonly current: number;
  readonly longest: number;
  readonly graceUsed: boolean;
  /** The current run's forgiven days, newest first. */
  readonly forgivenDays: readonly string[];
  readonly window: readonly StreakDay[];
}

/** One missed day is forgiven per rolling week: two forgiven days in one run are at least this many days apart. */
export const GRACE_GAP_DAYS = 7;

const EPOCH = "1970-01-01";
const dayNumber = (day: string) => daysBetween(EPOCH, day);
const dayOf = (number: number) => shiftDay(EPOCH, number);

/**
 * A missed day keeps the run going when the day before it was played and no day this walk already forgave lies
 * within GRACE_GAP_DAYS after it. Two missed days in a row, or a second miss inside that week, end the run.
 */
function runEndingAt(played: ReadonlySet<number>, last: number): StreakRun {
  const forgiven: number[] = [];
  let count = 0;
  for (let day = last; ; day -= 1) {
    if (played.has(day)) count += 1;
    else if (played.has(day - 1) && (forgiven.at(-1) ?? Infinity) - day >= GRACE_GAP_DAYS) forgiven.push(day);
    else break;
  }
  return { played: count, forgivenDays: forgiven.map(dayOf) };
}

/** The run ending on each played day, in the order given, by the same rule as the current streak. */
export function runsByDay(days: readonly string[]): readonly StreakRun[] {
  const played = new Set(days.map(dayNumber));
  return days.map((day) => runEndingAt(played, dayNumber(day)));
}

export function streakOf(days: readonly string[], today: string): StreakValue {
  const played = new Set(days.map(dayNumber));
  const end = dayNumber(today) - (played.has(dayNumber(today)) ? 0 : 1);
  const run = runEndingAt(played, end);
  const forgiven = new Set(run.forgivenDays);
  return {
    current: run.played,
    longest: runsByDay(days).reduce((longest, { played: count }) => Math.max(longest, count), run.played),
    graceUsed: run.forgivenDays.length > 0,
    forgivenDays: run.forgivenDays,
    window: Array.from({ length: LAB_THRESHOLDS.streakWindow }, (_, index): StreakDay => {
      const day = shiftDay(today, index - (LAB_THRESHOLDS.streakWindow - 1));
      if (played.has(dayNumber(day))) return "played";
      if (forgiven.has(day)) return "forgiven";
      return day === today ? "today" : "missed";
    }),
  };
}
