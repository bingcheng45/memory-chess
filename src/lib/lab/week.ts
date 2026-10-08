import { shiftDay } from "./engine";
import { daysBetween } from "./readiness";

export const WEEK_GOALS = [3, 4, 5, 7] as const;
export type WeekGoal = (typeof WEEK_GOALS)[number];
export const DEFAULT_WEEK_GOAL: WeekGoal = 5;

export interface WeekProgress {
  readonly daysPlayed: number;
  readonly goal: WeekGoal;
  /** Monday of the calendar week holding today, in the player's local days. */
  readonly weekStart: string;
  readonly remaining: number;
  /** Days from today to Sunday that could still add to the count: today counts only while it has no round. */
  readonly daysLeft: number;
}

const A_MONDAY = "1970-01-05";

export function weekProgress(days: readonly string[], today: string, goal: WeekGoal): WeekProgress {
  const weekday = ((daysBetween(A_MONDAY, today) % 7) + 7) % 7;
  const weekStart = shiftDay(today, -weekday);
  const daysPlayed = days.filter((day) => day >= weekStart && day <= today).length;
  const daysLeft = 6 - weekday + (days.includes(today) ? 0 : 1);
  return { daysPlayed, goal, weekStart, remaining: Math.max(0, goal - daysPlayed), daysLeft };
}

export function parseWeekGoal(value: string | null): WeekGoal | null {
  return WEEK_GOALS.find((goal) => String(goal) === value) ?? null;
}
