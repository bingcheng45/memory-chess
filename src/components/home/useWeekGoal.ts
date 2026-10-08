"use client";

import { DEFAULT_WEEK_GOAL, parseWeekGoal, type WeekGoal } from "@/lib/lab/week";
import { choiceStore } from "./labChoices";

export const WEEK_GOAL_KEY = "memory-chess-lab-goal";

const weekGoal = choiceStore<WeekGoal>(WEEK_GOAL_KEY, parseWeekGoal);

/** Clears the session fallback, so tests do not depend on the order they run in. */
export const resetWeekGoalSession = weekGoal.reset;

/** The player's weekly day goal on this device, kept apart from the round record and its export. */
export function useWeekGoal(): readonly [WeekGoal, (goal: WeekGoal) => void] {
  return [weekGoal.useValue() ?? DEFAULT_WEEK_GOAL, weekGoal.set];
}
