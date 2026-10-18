import type { LabSummary } from "@/lib/lab/summary";

export const FEEDBACK_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
export const FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY = "memory-chess-feedback-next-eligible-at";

let inMemoryNextEligibleAt = 0;

export function readNextEligibleAt(): number {
  try {
    const storedValue = window.localStorage.getItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY);
    if (storedValue === null) return 0;
    const parsedValue = Number(storedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  } catch {
    return inMemoryNextEligibleAt;
  }
}

export function writeNextEligibleAt(fromTime = Date.now()): void {
  const nextEligibleAt = fromTime + FEEDBACK_COOLDOWN_MS;
  inMemoryNextEligibleAt = nextEligibleAt;
  try {
    window.localStorage.setItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY, String(nextEligibleAt));
  } catch {
    // The in-memory value still prevents repeated prompts during this session.
  }
}

const ASK_FROM_ROUND = 5;

let sessionFirstResult: string | null = null;

/**
 * Whether the result screen for `result` asks for feedback. With the record as it stood before the round, from the
 * fifth round or a later day than the first; without one, from the session's second result. Never within a day of
 * the last ask.
 */
export function feedbackDue(before: Pick<LabSummary, "rounds" | "days"> | null, result: { readonly id: string; readonly day: string }, now = Date.now()): boolean {
  sessionFirstResult ??= result.id;
  if (readNextEligibleAt() > now) return false;
  if (!before) return sessionFirstResult !== result.id;
  const playedBeforeToday = (before.days[0] ?? result.day) < result.day;
  return before.rounds + 1 >= ASK_FROM_ROUND || playedBeforeToday;
}
