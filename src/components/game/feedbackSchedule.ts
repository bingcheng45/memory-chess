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

/**
 * Whether the result screen of a round that ended on local day `today` asks for feedback, read from the record as the
 * round found it. A player is asked from their fifth finished round or on a later day than their first, so never on
 * top of their first result.
 */
export function feedbackDue(before: Pick<LabSummary, "rounds" | "days">, today: string, now = Date.now()): boolean {
  const firstDay = before.days[0] ?? today;
  return (before.rounds + 1 >= ASK_FROM_ROUND || firstDay < today) && readNextEligibleAt() <= now;
}
