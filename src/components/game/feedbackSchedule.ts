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

/** Whether the result screen about to open will ask for feedback, so nothing else competes with that dialog. */
export function feedbackPromptDue(): boolean {
  return readNextEligibleAt() <= Date.now();
}
