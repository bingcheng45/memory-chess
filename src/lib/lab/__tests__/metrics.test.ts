import type { LabInput } from "@/lib/lab/engine";
import { deriveLab, LAB_METRICS } from "@/lib/lab/metrics";
import type { RoundRecordV1 } from "@/lib/lab/record";
import { EMPTY_SUMMARY, parseSummary, summarize, type LabSummary } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const HALF = "4k3/8/8/8/8/8/8/4K3";
const TODAY = "2026-10-07";

const fromRecords = (records: readonly RoundRecordV1[], today = TODAY): LabInput => ({ records, summary: summarize(records), today });
const fromSummary = (summary: LabSummary, today = TODAY): LabInput => ({ records: [], summary, today });
const withDays = (days: readonly string[]): LabSummary => ({ ...EMPTY_SUMMARY, rounds: days.length, days });

describe("streak", () => {
  const streak = (days: readonly string[], today = TODAY) => LAB_METRICS.streak.compute(fromSummary(withDays(days), today));

  it("is warming after one day and says one more is needed", () => {
    expect(streak(["2026-10-07"])).toMatchObject({
      readiness: { state: "warming", sampleSize: 1, need: { days: 1 } },
      value: { current: 1 },
    });
  });

  it("counts the run ending today, and the longest run", () => {
    const days = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-05", "2026-10-06", "2026-10-07"];

    expect(streak(days)).toMatchObject({ readiness: { state: "ready", sampleSize: 7 }, value: { current: 3, longest: 4 } });
  });

  it("keeps yesterday's run alive until today ends, and marks today pending", () => {
    const { value } = streak(["2026-10-05", "2026-10-06"]);

    expect(value?.current).toBe(2);
    expect(value?.window.slice(-3)).toEqual(["played", "played", "today"]);
  });

  it("crosses a month boundary", () => {
    expect(streak(["2026-09-30", "2026-10-01"], "2026-10-01").value?.current).toBe(2);
  });

  it("is empty, with no value, before any round", () => {
    expect(streak([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });
});

describe("bests", () => {
  const bests = (records: readonly RoundRecordV1[]) => LAB_METRICS.bests.compute(fromRecords(records));

  it("keeps the best reading per config with its round count", () => {
    expect(
      bests([
        round({ id: "a", placedFen: HALF }),
        round({ id: "b", endedAt: 2, solveMs: 9000 }),
        round({ id: "c", endedAt: 3, solveMs: 15000 }),
        round({ id: "d", endedAt: 4, pieceCount: 6 }),
      ]),
    ).toEqual({
      readiness: { state: "ready", sampleSize: 4 },
      value: {
        entries: [
          { key: "game:4x10", source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, correct: 4, solveMs: 9000, at: 2, rounds: 3 },
          { key: "game:6x10", source: "game", pieceCount: 6, memorizeSeconds: 10, accuracy: 100, correct: 4, solveMs: 20000, at: 4, rounds: 1 },
        ],
      },
    });
  });

  it("keeps practice readings apart from game bests at the same setting", () => {
    expect(bests([round({ id: "g", endedAt: 1, placedFen: HALF }), round({ id: "p", endedAt: 2, source: "calibration", solveMs: 5000 })]).value?.entries).toEqual([
      { key: "game:4x10", source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 50, correct: 2, solveMs: 20000, at: 1, rounds: 1 },
      { key: "calibration:4x10", source: "calibration", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, correct: 4, solveMs: 5000, at: 2, rounds: 1 },
    ]);
  });

  it("is empty with no rounds", () => {
    expect(bests([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });
});

describe("trend", () => {
  const trend = (records: readonly RoundRecordV1[]) => LAB_METRICS.trend.compute(fromRecords(records));

  it("derives a full 5,000-round log in well under a frame budget", () => {
    const base = round();
    const records = Array.from({ length: 5000 }, (_, index) => ({
      ...base,
      id: `r${index}`,
      endedAt: index,
      localDay: index < 2500 ? "2026-10-06" : "2026-10-07",
      config: { ...base.config, pieceCount: index % 10 === 0 ? 12 : 4 },
    }));
    const input = { records, summary: { ...EMPTY_SUMMARY, rounds: records.length }, today: TODAY };

    const started = performance.now();
    const result = LAB_METRICS.trend.compute(input);
    const elapsed = performance.now() - started;

    expect(result).toMatchObject({ readiness: { state: "ready", sampleSize: 4500 }, value: { setting: { source: "game", pieceCount: 4, memorizeSeconds: 10 } } });
    expect(elapsed).toBeLessThan(50);
  });

  const days = ["2026-10-06", "2026-10-06", "2026-10-07", "2026-10-07", "2026-10-07"];

  it("plots the most-played config once it has five rounds over two days", () => {
    const records = [
      ...days.map((localDay, index) => round({ id: `m${index}`, endedAt: index, localDay, placedFen: index % 2 ? HALF : TARGET })),
      round({ id: "other", endedAt: 9, pieceCount: 12, memorizeSeconds: 8 }),
    ];

    expect(trend(records)).toEqual({
      readiness: { state: "ready", sampleSize: 5 },
      value: { setting: { source: "game", pieceCount: 4, memorizeSeconds: 10 }, points: [100, 50, 100, 50, 100], bySession: [80], granularity: "round" },
    });
  });

  it("keeps practice and game rounds at the same setting on separate lines", () => {
    const records = [
      ...days.map((localDay, index) => round({ id: `p${index}`, source: "calibration", endedAt: index, localDay, pieceCount: 6 })),
      round({ id: "g1", endedAt: 10, pieceCount: 6, placedFen: HALF }),
      round({ id: "g2", endedAt: 11, pieceCount: 6, placedFen: HALF }),
    ];

    expect(trend(records)).toEqual({
      readiness: { state: "ready", sampleSize: 5 },
      value: { setting: { source: "calibration", pieceCount: 6, memorizeSeconds: 10 }, points: [100, 100, 100, 100, 100], bySession: [100], granularity: "round" },
    });
  });

  it("breaks a tie between practice and games toward the group played last", () => {
    const records = [
      round({ id: "p", source: "calibration", endedAt: 1, pieceCount: 6 }),
      round({ id: "g", endedAt: 2, pieceCount: 6, placedFen: HALF }),
    ];

    expect(trend(records)).toEqual({
      readiness: { state: "warming", sampleSize: 1, need: { rounds: 4, days: 1 } },
      value: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, points: [50], bySession: [50], granularity: "round" },
    });
  });

  it("draws a ready setting over a setting with more rounds that is still warming", () => {
    const records = [
      ...Array.from({ length: 6 }, (_, index) => round({ id: `p${index}`, source: "calibration", endedAt: index })),
      ...["2026-10-05", "2026-10-06", "2026-10-06", "2026-10-07", "2026-10-07"].map((localDay, index) =>
        round({ id: `g${index}`, endedAt: 10 + index, localDay, pieceCount: 6, placedFen: index % 2 ? HALF : TARGET }),
      ),
    ];

    expect(trend(records)).toEqual({
      readiness: { state: "ready", sampleSize: 5 },
      value: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, points: [100, 50, 100, 50, 100], bySession: [80], granularity: "round" },
    });
  });

  it("falls back to the setting with the most rounds when none is ready", () => {
    const records = [
      ...Array.from({ length: 4 }, (_, index) => round({ id: `p${index}`, source: "calibration", endedAt: index })),
      ...["2026-10-06", "2026-10-07", "2026-10-07"].map((localDay, index) => round({ id: `g${index}`, endedAt: 10 + index, localDay, pieceCount: 6 })),
    ];

    expect(trend(records)).toMatchObject({
      readiness: { state: "warming", sampleSize: 4, need: { rounds: 1, days: 1 } },
      value: { setting: { source: "calibration", pieceCount: 4, memorizeSeconds: 10 } },
    });
  });

  it("asks for another day when five rounds all fell on one", () => {
    const records = days.map((_, index) => round({ id: `s${index}`, endedAt: index }));

    expect(trend(records).readiness).toEqual({ state: "warming", sampleSize: 5, need: { days: 1 } });
  });

  it("has nothing to plot without rounds", () => {
    expect(trend([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  const HOUR = 60 * 60 * 1000;
  const sittings = (perSitting: readonly number[]) =>
    perSitting.flatMap((count, sitting) =>
      Array.from({ length: count }, (_, index) =>
        round({ id: `s${sitting}-${index}`, endedAt: sitting * HOUR + index * 60_000, localDay: sitting < 2 ? "2026-10-06" : TODAY, placedFen: sitting % 2 ? HALF : TARGET }),
      ),
    );

  it("plots by session once the setting has 8 rounds over 4 sessions, keeping the round points", () => {
    expect(trend(sittings([2, 2, 2, 2])).value).toEqual({
      setting: { source: "game", pieceCount: 4, memorizeSeconds: 10 },
      points: [100, 100, 50, 50, 100, 100, 50, 50],
      bySession: [100, 50, 100, 50],
      granularity: "session",
    });
  });

  it("stays round by round with 8 rounds in 3 sessions, or 7 rounds in 4", () => {
    expect(trend(sittings([3, 3, 2])).value).toMatchObject({ bySession: [100, 50, 100], granularity: "round" });
    expect(trend(sittings([2, 2, 2, 1])).value).toMatchObject({ bySession: [100, 50, 100, 50], granularity: "round" });
  });

  it("averages a setting's rounds within a sitting even when other settings are played between them", () => {
    const records = [
      round({ id: "a", endedAt: 0 }),
      round({ id: "other", endedAt: 20 * 60_000, pieceCount: 12 }),
      round({ id: "b", endedAt: 40 * 60_000, placedFen: HALF }),
      round({ id: "c", endedAt: 3 * HOUR }),
    ];

    expect(trend(records).value?.bySession).toEqual([75, 100]);
  });

  it("keeps a ready line but marks it stale once the last round is two weeks old", () => {
    const records = days.map((localDay, index) => round({ id: `o${index}`, endedAt: index, localDay }));

    expect(LAB_METRICS.trend.compute(fromRecords(records, "2026-10-21")).readiness.state).toBe("stale");
    expect(LAB_METRICS.trend.compute(fromRecords(records, "2026-10-20")).readiness.state).toBe("ready");
  });
});

describe("typeRecall", () => {
  const recall = (summary: LabSummary) => LAB_METRICS.typeRecall.compute(fromSummary(summary));

  it("does not read kings as a ready type, since every round has two", () => {
    const summary = summarize(Array.from({ length: 10 }, (_, index) => round({ id: `t${index}`, endedAt: index, placedFen: HALF })));

    expect(recall(summary)).toMatchObject({
      readiness: { state: "warming", sampleSize: 10, need: { exposures: 10 } },
      value: { king: { type: "k", shown: 20, recalled: 20, ready: true }, roundsEstimate: 10 },
    });
  });

  it("readies a type other than the king at 20 sightings and keeps the king as a baseline", () => {
    const summary = summarize(Array.from({ length: 20 }, (_, index) => round({ id: `t${index}`, endedAt: index, placedFen: HALF })));
    const { readiness, value } = recall(summary);

    expect(value?.types.map(({ type }) => type)).toEqual(["q", "r", "b", "n", "p"]);
    expect(value?.types.find(({ type }) => type === "q")).toEqual({ type: "q", shown: 20, recalled: 0, ready: true });
    expect(value?.king).toEqual({ type: "k", shown: 40, recalled: 40, ready: true });
    expect(readiness).toEqual({ state: "ready", sampleSize: 20 });
    expect(value?.roundsEstimate).toBe(0);
  });

  it("marks a record of kings-only rounds, which no amount of play at that setting will ready", () => {
    const KINGS = "4k3/8/8/8/8/8/8/4K3";
    const summary = summarize(Array.from({ length: 50 }, (_, index) => round({ id: `k${index}`, endedAt: index, pieceCount: 2, targetFen: KINGS, placedFen: KINGS })));

    expect(recall(summary)).toMatchObject({
      readiness: { state: "warming", need: { exposures: 20 } },
      value: { onlyKings: true, king: { type: "k", shown: 100, recalled: 100, ready: true }, roundsEstimate: null },
    });
    expect(recall(EMPTY_SUMMARY).value).toBeNull();
    expect(recall(summarize([round()])).value?.onlyKings).toBe(false);
  });

  it("compares its exposures threshold with the most-shown type other than the king", () => {
    const { exposures } = LAB_METRICS.typeRecall.thresholds;
    const counted = (queens: number) => recall({ ...EMPTY_SUMMARY, rounds: 10, days: [TODAY], typeShown: { k: 40, q: queens, n: 5 } }).readiness;

    expect(exposures).toBe(20);
    expect(counted(19)).toEqual({ state: "warming", sampleSize: 10, need: { exposures: 1 } });
    expect(counted(20)).toEqual({ state: "ready", sampleSize: 10 });
  });

  it("estimates rounds until the first type other than the king is ready", () => {
    expect(recall(summarize([round()]))).toMatchObject({ readiness: { state: "warming" }, value: { roundsEstimate: 19 } });
  });
});

describe("missMap", () => {
  const missMap = (summary: LabSummary) => LAB_METRICS.missMap.compute(fromSummary(summary));

  it("stays on files and ranks until every line has 10 exposures", () => {
    const { readiness, value } = missMap(summarize([round({ placedFen: HALF })]));

    expect(value?.view).toBe("lines");
    expect(readiness).toEqual({ state: "warming", sampleSize: 1, need: { exposures: 10 } });
    expect(value?.files[3]).toEqual({ shown: 1, missed: 1, ready: false });
    expect(value?.files[4]).toEqual({ shown: 2, missed: 0, ready: false });
    expect(value?.ranks[0]).toEqual({ shown: 1, missed: 0, ready: false });
    expect(value?.roundsEstimate).toBeNull();
  });

  it("compares its exposures threshold with the thinnest file or rank, not with a square", () => {
    const { exposures } = LAB_METRICS.missMap.thresholds;
    const withFileA = (fileA: readonly number[]) =>
      missMap({ ...EMPTY_SUMMARY, rounds: 8, days: [TODAY], squareShown: Array.from({ length: 64 }, (_, index) => (index % 8 === 0 ? fileA[index / 8] : 2)) });

    expect(exposures).toBe(10);
    expect(withFileA([2, 2, 2, 2, 1, 0, 0, 0])).toMatchObject({ readiness: { state: "warming", need: { exposures: 1 } }, value: { view: "lines" } });
    expect(withFileA([2, 2, 2, 2, 2, 0, 0, 0])).toMatchObject({ readiness: { state: "ready", sampleSize: 8 }, value: { view: "lines" } });
  });

  it("switches to squares when every square has 10 exposures", () => {
    const full = { ...EMPTY_SUMMARY, rounds: 80, days: [TODAY], squareShown: Array(64).fill(10), squareMissed: Array(64).fill(2) };

    expect(missMap(full)).toMatchObject({ readiness: { state: "ready", sampleSize: 80 }, value: { view: "squares", roundsEstimate: 0 } });
  });
});

describe("deriveLab", () => {
  it("returns every registered metric under its id", () => {
    const results = deriveLab(fromRecords([round()]));

    const ids = ["streak", "bests", "trend", "typeRecall", "missMap", "sessions", "span", "piecesHeld", "speed"];

    expect(Object.keys(results)).toEqual(ids);
    expect(Object.values(LAB_METRICS).map(({ id }) => id)).toEqual(ids);
    expect(results.bests.readiness).toEqual({ state: "ready", sampleSize: 1 });
  });
});

describe("parseSummary", () => {
  it("accepts a summary it wrote and rejects a damaged one", () => {
    const summary = summarize([round()]);

    expect(parseSummary(JSON.parse(JSON.stringify(summary)))).toEqual(summary);
    expect(parseSummary({ ...summary, squareShown: [1, 2] })).toBeNull();
    expect(parseSummary({ ...summary, v: 1 })).toBeNull();
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
