import { FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY, feedbackDue } from "@/components/game/feedbackSchedule";

const NOW = Date.parse("2026-10-18T12:00:00Z");
const before = (rounds: number, firstDay?: string) => ({ rounds, days: firstDay ? [firstDay] : [] });

beforeEach(() => window.localStorage.clear());

describe("feedbackDue", () => {
  it("never asks on a player's first result", () => {
    expect(feedbackDue(before(0), "2026-10-18", NOW)).toBe(false);
  });

  it("waits through the fourth round of the first day and asks on the fifth", () => {
    expect(feedbackDue(before(3, "2026-10-18"), "2026-10-18", NOW)).toBe(false);
    expect(feedbackDue(before(4, "2026-10-18"), "2026-10-18", NOW)).toBe(true);
  });

  it("asks on a later day than the first round, after only one round before", () => {
    expect(feedbackDue(before(1, "2026-10-17"), "2026-10-18", NOW)).toBe(true);
  });

  it("stays quiet for a day after it last asked, whatever the record holds", () => {
    window.localStorage.setItem(FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY, String(NOW + 1));

    expect(feedbackDue(before(9, "2026-10-01"), "2026-10-18", NOW)).toBe(false);
    expect(feedbackDue(before(9, "2026-10-01"), "2026-10-18", NOW + 1)).toBe(true);
  });
});
