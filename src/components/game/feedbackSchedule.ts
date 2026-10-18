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

export function feedbackDue(before: Pick<LabSummary, "rounds" | "days">, today: string, now = Date.now()): boolean {
  const roundNumber = before.rounds + 1;
  const playedBeforeToday = (before.days[0] ?? today) < today;
  return (roundNumber >= ASK_FROM_ROUND || playedBeforeToday) && readNextEligibleAt() <= now;
}
