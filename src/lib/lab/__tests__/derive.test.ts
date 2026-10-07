import { deriveBests, deriveMissMap, deriveStreak, deriveTrend, deriveTypeRecall } from "@/lib/lab/derive";
import { EMPTY_SUMMARY, parseSummary, summarize } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const HALF = "4k3/8/8/8/8/8/8/4K3";

describe("deriveStreak", () => {
  it("is not ready after one day and says one more is needed", () => {
    expect(deriveStreak(["2026-10-07"], "2026-10-07")).toMatchObject({
      ready: false,
      sampleSize: 1,
      current: 1,
      daysNeeded: 1,
    });
  });

  it("counts the run ending today, and the longest run", () => {
    const days = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-05", "2026-10-06", "2026-10-07"];

    expect(deriveStreak(days, "2026-10-07")).toMatchObject({ ready: true, current: 3, longest: 4, daysNeeded: 0 });
  });

  it("keeps yesterday's run alive until today ends, and marks today pending", () => {
    const streak = deriveStreak(["2026-10-05", "2026-10-06"], "2026-10-07");

    expect(streak.current).toBe(2);
    expect(streak.window.slice(-3)).toEqual(["played", "played", "today"]);
  });

  it("crosses a month boundary", () => {
    expect(deriveStreak(["2026-09-30", "2026-10-01"], "2026-10-01").current).toBe(2);
  });
});

describe("deriveBests", () => {
  it("keeps the best reading per config with its round count", () => {
    const summary = summarize([
      round({ id: "a", placedFen: HALF }),
      round({ id: "b", endedAt: 2, solveMs: 9000 }),
      round({ id: "c", endedAt: 3, solveMs: 15000 }),
      round({ id: "d", endedAt: 4, pieceCount: 6 }),
    ]);

    expect(deriveBests(summary)).toEqual({
      ready: true,
      sampleSize: 4,
      entries: [
        { pieceCount: 4, memorizeSeconds: 10, accuracy: 100, correct: 4, solveMs: 9000, at: 2, rounds: 3 },
        { pieceCount: 6, memorizeSeconds: 10, accuracy: 100, correct: 4, solveMs: 20000, at: 4, rounds: 1 },
      ],
    });
  });

  it("is not ready with no rounds", () => {
    expect(deriveBests(EMPTY_SUMMARY)).toEqual({ ready: false, sampleSize: 0, entries: [] });
  });
});

describe("deriveTrend", () => {
  const days = ["2026-10-06", "2026-10-06", "2026-10-07", "2026-10-07", "2026-10-07"];

  it("plots the most-played config once it has five rounds over two days", () => {
    const records = [
      ...days.map((localDay, index) => round({ id: `m${index}`, endedAt: index, localDay, placedFen: index % 2 ? HALF : TARGET })),
      round({ id: "other", endedAt: 9, pieceCount: 12, memorizeSeconds: 8 }),
    ];

    expect(deriveTrend(records)).toEqual({
      ready: true,
      sampleSize: 5,
      config: { pieceCount: 4, memorizeSeconds: 10 },
      points: [100, 50, 100, 50, 100],
      roundsNeeded: 0,
      daysNeeded: 0,
    });
  });

  it("asks for another day when five rounds all fell on one", () => {
    const records = days.map((_, index) => round({ id: `s${index}`, endedAt: index }));

    expect(deriveTrend(records)).toMatchObject({ ready: false, roundsNeeded: 0, daysNeeded: 1 });
  });

  it("has nothing to plot without rounds", () => {
    expect(deriveTrend([])).toMatchObject({ ready: false, sampleSize: 0, config: null, roundsNeeded: 5, daysNeeded: 2 });
  });
});

describe("deriveTypeRecall", () => {
  it("readies a type at 20 exposures and estimates rounds for the rest", () => {
    const summary = summarize(Array.from({ length: 10 }, (_, index) => round({ id: `t${index}`, endedAt: index, placedFen: HALF })));
    const recall = deriveTypeRecall(summary);

    expect(recall.types.find(({ type }) => type === "k")).toEqual({ type: "k", shown: 20, recalled: 20, ready: true });
    expect(recall.types.find(({ type }) => type === "q")).toEqual({ type: "q", shown: 10, recalled: 0, ready: false });
    expect(recall).toMatchObject({ ready: true, sampleSize: 10, roundsNeeded: 0 });
  });

  it("estimates how many rounds until the first bar is ready", () => {
    const summary = summarize([round()]);

    expect(deriveTypeRecall(summary)).toMatchObject({ ready: false, roundsNeeded: 9 });
  });
});

describe("deriveMissMap", () => {
  it("stays on files and ranks until every line has 10 exposures", () => {
    const summary = summarize([round({ placedFen: HALF })]);
    const map = deriveMissMap(summary);

    expect(map.view).toBe("lines");
    expect(map.ready).toBe(false);
    expect(map.files[3]).toEqual({ shown: 1, missed: 1, ready: false });
    expect(map.files[4]).toEqual({ shown: 2, missed: 0, ready: false });
    expect(map.ranks[0]).toEqual({ shown: 1, missed: 0, ready: false });
    expect(map.roundsNeeded).toBeNull();
  });

  it("switches to squares when every square has 10 exposures", () => {
    const full = { ...EMPTY_SUMMARY, rounds: 80, squareShown: Array(64).fill(10), squareMissed: Array(64).fill(2) };

    expect(deriveMissMap(full)).toMatchObject({ ready: true, view: "squares", roundsNeeded: 0 });
  });
});

describe("parseSummary", () => {
  it("accepts a summary it wrote and rejects a damaged one", () => {
    const summary = summarize([round()]);

    expect(parseSummary(JSON.parse(JSON.stringify(summary)))).toEqual(summary);
    expect(parseSummary({ ...summary, squareShown: [1, 2] })).toBeNull();
    expect(parseSummary({ ...summary, v: 2 })).toBeNull();
  });

  it("counts squares and types from the outcome string", () => {
    expect(summarize([round({ placedFen: HALF })])).toMatchObject({
      rounds: 1,
      days: ["2026-10-07"],
      typeShown: { k: 2, q: 1, n: 1 },
      typeMissed: { q: 1, n: 1 },
    });
  });
});
