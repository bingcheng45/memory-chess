import { readinessOf } from "@/lib/lab/readiness";

const TREND = { rounds: 5, days: 2 };

describe("readinessOf", () => {
  it("is empty with no data, whatever the thresholds", () => {
    expect(readinessOf({ sampleSize: 0, have: { rounds: 0, days: 0 }, thresholds: TREND, lastDay: null, today: "2026-10-08" })).toEqual({
      state: "empty",
      sampleSize: 0,
    });
  });

  it("is warming with exactly what is still missing, and nothing already met", () => {
    expect(readinessOf({ sampleSize: 2, have: { rounds: 2, days: 1 }, thresholds: TREND, lastDay: "2026-10-08", today: "2026-10-08" })).toEqual({
      state: "warming",
      sampleSize: 2,
      need: { rounds: 3, days: 1 },
    });
    expect(readinessOf({ sampleSize: 7, have: { rounds: 7, days: 1 }, thresholds: TREND, lastDay: "2026-10-08", today: "2026-10-08" })).toEqual({
      state: "warming",
      sampleSize: 7,
      need: { days: 1 },
    });
    expect(readinessOf({ sampleSize: 4, have: { exposures: 13 }, thresholds: { exposures: 20 }, lastDay: "2026-10-08", today: "2026-10-08" })).toEqual({
      state: "warming",
      sampleSize: 4,
      need: { exposures: 7 },
    });
  });

  it("is ready once every threshold is met", () => {
    expect(readinessOf({ sampleSize: 9, have: { rounds: 9, days: 3 }, thresholds: TREND, lastDay: "2026-10-08", today: "2026-10-08" })).toEqual({
      state: "ready",
      sampleSize: 9,
    });
  });

  it("turns stale when the last round is exactly 14 days old, and not a day sooner", () => {
    const ready = { sampleSize: 9, have: { rounds: 9, days: 3 }, thresholds: TREND, today: "2026-10-08" };

    expect(readinessOf({ ...ready, lastDay: "2026-09-25" }).state).toBe("ready");
    expect(readinessOf({ ...ready, lastDay: "2026-09-24" })).toEqual({ state: "stale", sampleSize: 9 });
  });

  it("keeps an old record that never met its threshold warming, since the missing rounds are still the news", () => {
    expect(
      readinessOf({ sampleSize: 1, have: { days: 1 }, thresholds: { days: 2 }, lastDay: "2026-08-01", today: "2026-10-08" }),
    ).toEqual({ state: "warming", sampleSize: 1, need: { days: 1 } });
  });

  it("is never stale before the client knows what day it is", () => {
    expect(readinessOf({ sampleSize: 9, have: { rounds: 9, days: 3 }, thresholds: TREND, lastDay: "2026-01-01", today: "" }).state).toBe("ready");
  });
});
