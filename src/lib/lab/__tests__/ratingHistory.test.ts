import { ratingHistoryOf } from "../ratingHistory";

const NOW = Date.UTC(2026, 9, 18, 12);
const daysAgo = (days: number) => NOW - days * 86_400_000;

describe("ratingHistoryOf", () => {
  it("walks the stored changes back from the current rating and sums the last 7 days", () => {
    const rows = [
      { timestamp: daysAgo(1), skillRatingChange: 10 },
      { timestamp: daysAgo(3), skillRatingChange: -5 },
      { timestamp: daysAgo(10), skillRatingChange: 20 },
    ];

    expect(ratingHistoryOf(1025, rows, NOW)).toEqual({
      current: 1025,
      start: 1000,
      steps: [
        { at: daysAgo(10), rating: 1020, change: 20 },
        { at: daysAgo(3), rating: 1015, change: -5 },
        { at: daysAgo(1), rating: 1025, change: 10 },
      ],
      peak: { index: 3, rating: 1025 },
      isNewPeak: true,
      period: { kind: "days", days: 7, change: 5, rounds: 2 },
    });
  });

  it("falls back to every held round when none fall in the period, and names an older peak", () => {
    const rows = [
      { timestamp: daysAgo(9), skillRatingChange: -12 },
      { timestamp: daysAgo(12), skillRatingChange: 30 },
    ];

    const history = ratingHistoryOf(1018, rows, NOW);
    expect(history.period).toEqual({ kind: "rounds", change: 18, rounds: 2 });
    expect(history.peak).toEqual({ index: 1, rating: 1030 });
    expect(history.isNewPeak).toBe(false);
  });

  it("skips rows without a rating change", () => {
    const rows = [{ timestamp: daysAgo(1), skillRatingChange: 8 }, { timestamp: daysAgo(2) }, { timestamp: daysAgo(4), skillRatingChange: -3 }];

    const history = ratingHistoryOf(1005, rows, NOW);
    expect(history.start).toBe(1000);
    expect(history.steps.map(({ rating }) => rating)).toEqual([997, 1005]);
  });

  it("starts at the current rating with no rated rounds", () => {
    expect(ratingHistoryOf(1000, [], NOW)).toEqual({
      current: 1000,
      start: 1000,
      steps: [],
      peak: { index: 0, rating: 1000 },
      isNewPeak: false,
      period: { kind: "rounds", change: 0, rounds: 0 },
    });
  });

  it("does not call a peak new when the line ends where it started", () => {
    const rows = [
      { timestamp: daysAgo(1), skillRatingChange: 6 },
      { timestamp: daysAgo(2), skillRatingChange: -6 },
    ];

    expect(ratingHistoryOf(1000, rows, NOW)).toMatchObject({ peak: { index: 2, rating: 1000 }, isNewPeak: false });
  });
});
