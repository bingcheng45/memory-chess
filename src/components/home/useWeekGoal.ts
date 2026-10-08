"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_WEEK_GOAL, parseWeekGoal, type WeekGoal } from "@/lib/lab/week";

export const WEEK_GOAL_KEY = "memory-chess-lab-goal";

/** When storage refuses the write, the goal is kept here for the rest of the session. */
let goalThisSession: WeekGoal | null = null;
const listeners = new Set<() => void>();

function readGoal(): WeekGoal {
  if (goalThisSession !== null) return goalThisSession;
  try {
    return parseWeekGoal(window.localStorage.getItem(WEEK_GOAL_KEY)) ?? DEFAULT_WEEK_GOAL;
  } catch {
    return DEFAULT_WEEK_GOAL;
  }
}

function storeGoal(goal: WeekGoal) {
  try {
    window.localStorage.setItem(WEEK_GOAL_KEY, String(goal));
    goalThisSession = null;
  } catch {
    goalThisSession = goal;
  }
  listeners.forEach((listener) => listener());
}

/** Another tab's change arrives as a storage event; a cleared store (key null) falls back to the default. */
function subscribe(onChange: () => void) {
  const onStorage = ({ key }: StorageEvent) => {
    if (key === WEEK_GOAL_KEY || key === null) onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The player's weekly day goal on this device, kept apart from the round record and its export. */
export function useWeekGoal(): readonly [WeekGoal, (goal: WeekGoal) => void] {
  return [useSyncExternalStore(subscribe, readGoal, () => DEFAULT_WEEK_GOAL), storeGoal];
}
