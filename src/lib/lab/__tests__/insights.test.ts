import type { LabInput } from "@/lib/lab/engine";
import { aboutTimes } from "@/lib/lab/insights";
import { deriveLab } from "@/lib/lab/metrics";
import type { RoundRecord } from "@/lib/lab/record";
import { summarize, type LabSummary } from "@/lib/lab/summary";
import { playedFresh, round, TARGET } from "./fixtures";

const NO_QUEEN = "4k3/8/8/8/8/5N2/8/4K3";

function insightsOf(records: readonly RoundRecord[], summary: Partial<LabSummary> = {}) {
  const input: LabInput = { records, summary: { ...summarize(records), ...summary }, today: "" };
  return deriveLab(input).insights;
}

/** Only the lifetime counters, as a player with 30 rounds whose log the summary-only rules never read. */
const counters = (summary: Partial<LabSummary>) => insightsOf([], { days: ["2026-10-07"], ...summary, ...playedFresh(summary.rounds ?? 30) });

/** One round a day from 1 September, oldest first: a whole board when `full`, else the queen missed. */
function daily(count: number, shape: (index: number) => { full: boolean; solveMs?: number }): RoundRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const { full, solveMs = 20_000 } = shape(index);
    const date = new Date(Date.UTC(2026, 8, 1 + index, 12));
    return round({ id: `d${index}`, endedAt: date.getTime(), localDay: date.toISOString().slice(0, 10), placedFen: full ? TARGET : NO_QUEEN, solveMs });
  });
}

/** Twenty shown on every square; `missed` gives the misses on each square of a file, by file index a to h. */
function squares(missed: readonly number[], shown: readonly number[] = Array(8).fill(20)) {
  return {
    squareShown: Array.from({ length: 64 }, (_, index) => shown[index % 8]),
    squareMissed: Array.from({ length: 64 }, (_, index) => missed[index % 8]),
  };
}

const ids = (result: ReturnType<typeof insightsOf>) => result.value?.insights.map(({ ruleId }) => ruleId);

describe("insights readiness", () => {
  it("is empty before the first round", () => {
    expect(insightsOf([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("warms up until 10 rounds and finds nothing meanwhile, even on data a rule would read", () => {
    const result = counters({ rounds: 9, ...squares([8, 0, 0, 4, 4, 0, 0, 8]) });

    expect(result).toEqual({ readiness: { state: "warming", sampleSize: 9, need: { rounds: 1 } }, value: { insights: [] } });
  });

  it("is ready at 10 rounds with no finding when nothing passes a rule", () => {
    expect(counters({ rounds: 10 })).toEqual({ readiness: { state: "ready", sampleSize: 10 }, value: { insights: [] } });
  });
});

describe("edge files rule", () => {
  it("finds the a and h files missed twice as often as d and e", () => {
    expect(counters(squares([8, 0, 0, 4, 4, 0, 0, 8])).value?.insights).toEqual([
      {
        ruleId: "edgeFiles",
        params: { times: 2, edge: 40, centre: 20, edgeShown: 320, centreShown: 320 },
        action: { kind: "rig", pieceCount: 8, memorizeSeconds: 15 },
        strength: 1.11,
      },
    ]);
  });

  it("prints the multiple to one decimal, so 1.8 never reads as twice", () => {
    expect([1.8, 1.94, 1.95, 2.3, 5.5].map(aboutTimes)).toEqual([1.8, 1.9, 2, 2.3, 5.5]);
    expect(counters(squares([9, 0, 0, 5, 5, 0, 0, 9])).value?.insights[0].params).toMatchObject({ times: 1.8, edge: 45, centre: 25 });
  });

  it("prints a centre rate above zero but under 1% as 0, which the sentence words as under 1%", () => {
    expect(counters(fewMisses(10, 1)).value?.insights[0].params).toMatchObject({ times: 10, edge: 3, centre: 0, centreShown: 320 });
  });

  it("prints the multiple of whole and half ratios as they are", () => {
    expect(counters(squares([10, 0, 0, 2, 2, 0, 0, 10])).value?.insights[0].params).toMatchObject({ times: 5, edge: 50, centre: 10 });
    expect(counters(squares([10, 0, 0, 4, 4, 0, 0, 10])).value?.insights[0].params).toMatchObject({ times: 2.5, edge: 50, centre: 20 });
  });

  it("says the centre files had no miss instead of dividing by zero", () => {
    expect(counters(squares([3, 0, 0, 0, 0, 0, 0, 3])).value?.insights[0].params).toEqual({ times: 0, edge: 15, centre: 0, edgeShown: 320, centreShown: 320 });
  });

  /** Twenty shown on every square, with the edge misses on a1 and the centre misses on d1. */
  const fewMisses = (edge: number, centre: number) => ({
    squareShown: Array<number>(64).fill(20),
    squareMissed: Array.from({ length: 64 }, (_, index) => (index === 0 ? edge : index === 3 ? centre : 0)),
  });

  it("finds nothing from 2 edge misses against 1, or 1 against none, under 5 misses on the a and h files", () => {
    expect(ids(counters(fewMisses(2, 1)))).toEqual([]);
    expect(ids(counters(fewMisses(1, 0)))).toEqual([]);
    expect(ids(counters(fewMisses(4, 0)))).toEqual([]);
  });

  it("fires from 5 edge misses, with the centre missed or not", () => {
    expect(counters(fewMisses(5, 2)).value?.insights[0]).toMatchObject({ ruleId: "edgeFiles", params: { edge: 2, centre: 0 }, strength: 1.39 });
    expect(counters(fewMisses(5, 0)).value?.insights[0]).toMatchObject({ ruleId: "edgeFiles", params: { times: 0, edge: 2, centre: 0 }, strength: 0.99 });
  });

  it("finds nothing at 1.75 times the centre", () => {
    expect(ids(counters(squares([7, 0, 0, 4, 4, 0, 0, 7])))).toEqual([]);
  });

  it("finds nothing when one of the four files has fewer than 10 pieces seen, and fires at exactly 10", () => {
    const thin = [20, 20, 20, 20, 20, 20, 20, 20].map((count, file) => (file === 7 ? 0 : count));
    const shownOnH = (perSquare: number) => {
      const counts = squares([8, 0, 0, 4, 4, 0, 0, 0], thin);
      return { ...counts, squareShown: counts.squareShown.map((count, index) => (index === 7 ? perSquare : count)), squareMissed: counts.squareMissed.map((count, index) => (index === 7 ? 5 : count)) };
    };

    expect(ids(counters(shownOnH(9)))).toEqual([]);
    expect(ids(counters(shownOnH(10)))).toEqual(["edgeFiles"]);
  });
});

describe("weak piece type rule", () => {
  it("names the type other than the king with at least 20 sightings and the lowest recall under half", () => {
    const result = counters({ typeShown: { k: 60, q: 20, r: 25, p: 30 }, typeMissed: { k: 40, q: 11, r: 14, p: 3 } });

    expect(result.value?.insights).toEqual([
      {
        ruleId: "weakType",
        params: { type: "r", recalled: 11, shown: 25, percent: 44 },
        action: { kind: "guide", guide: "patterns" },
        strength: 1.14,
      },
    ]);
  });

  it("finds nothing below 20 sightings or at half", () => {
    expect(ids(counters({ typeShown: { q: 19 }, typeMissed: { q: 15 } }))).toEqual([]);
    expect(ids(counters({ typeShown: { q: 20 }, typeMissed: { q: 10 } }))).toEqual([]);
    expect(ids(counters({ typeShown: { q: 20 }, typeMissed: { q: 11 } }))).toEqual(["weakType"]);
  });
});

describe("colour rule", () => {
  it("names the colour recalled at least 8 points less often once each colour has 100 sightings", () => {
    expect(counters({ colorShown: { w: 100, b: 120 }, colorMissed: { w: 10, b: 24 } }).value?.insights).toEqual([
      {
        ruleId: "colourGap",
        params: { weaker: "b", weakerPercent: 80, strongerPercent: 90, weakerShown: 120, strongerShown: 100 },
        action: { kind: "guide", guide: "vision" },
        strength: 1.25,
      },
    ]);
    expect(counters({ colorShown: { w: 150, b: 100 }, colorMissed: { w: 45, b: 10 } }).value?.insights[0].params).toMatchObject({ weaker: "w", weakerPercent: 70 });
  });

  it("finds nothing under 100 sightings of either colour or under an 8 point gap", () => {
    expect(ids(counters({ colorShown: { w: 99, b: 100 }, colorMissed: { w: 30, b: 0 } }))).toEqual([]);
    expect(ids(counters({ colorShown: { w: 100, b: 100 }, colorMissed: { w: 10, b: 17 } }))).toEqual([]);
    expect(ids(counters({ colorShown: { w: 100, b: 100 }, colorMissed: { w: 10, b: 18 } }))).toEqual(["colourGap"]);
  });
});

describe("plateau rule", () => {
  const steady = (count: number) => daily(count, (index) => ({ full: index % 2 === 0 }));

  it("finds accuracy flat over 20 rounds at the setting played most and a span unchanged for a week, and offers one more piece", () => {
    expect(insightsOf(steady(20)).value?.insights).toEqual([
      {
        ruleId: "plateau",
        params: { source: "game", pieceCount: 4, memorizeSeconds: 10, last: 88, before: 88, span: 4 },
        action: { kind: "rig", pieceCount: 5, memorizeSeconds: 10 },
        strength: 2,
      },
    ]);
  });

  it("finds nothing with 19 rounds at the setting", () => {
    expect(ids(insightsOf(steady(19)))).toEqual([]);
  });

  it("finds nothing when the last 10 rounds moved more than 2 points", () => {
    const rising = daily(20, (index) => ({ full: index % 2 === 0 || index === 19 }));

    expect(ids(insightsOf(rising))).toEqual([]);
  });

  /** One round a day from 1 January, alternating 100 and 75 percent unless `full` says otherwise. */
  function career(stints: readonly { count: number; pieceCount: number; memorizeSeconds: number; full?: (index: number) => boolean }[]) {
    let day = 0;
    return stints.flatMap(({ count, pieceCount, memorizeSeconds, full = (index) => index % 2 === 0 }) =>
      Array.from({ length: count }, (_, index) => {
        const date = new Date(Date.UTC(2026, 0, 1 + day++, 12));
        const placedFen = full(index) ? TARGET : NO_QUEEN;
        return round({ id: `c${day}`, endedAt: date.getTime(), localDay: date.toISOString().slice(0, 10), pieceCount, memorizeSeconds, placedFen });
      }),
    );
  }
  const plateauOf = (records: readonly RoundRecord[]) => insightsOf(records).value?.insights.find(({ ruleId }) => ruleId === "plateau");

  it("reads the setting of the last 20 rounds, not an abandoned one with more rounds, and offers one piece past the span", () => {
    const records = career([
      { count: 200, pieceCount: 4, memorizeSeconds: 10 },
      { count: 30, pieceCount: 8, memorizeSeconds: 15 },
    ]);

    expect(plateauOf(records)).toEqual({
      ruleId: "plateau",
      params: { source: "game", pieceCount: 8, memorizeSeconds: 15, last: 88, before: 88, span: 8 },
      action: { kind: "rig", pieceCount: 9, memorizeSeconds: 15 },
      strength: 2,
    });
  });

  it("finds no plateau after the switch when accuracy at the new setting is still moving", () => {
    const records = career([
      { count: 200, pieceCount: 4, memorizeSeconds: 10 },
      { count: 30, pieceCount: 8, memorizeSeconds: 15, full: (index) => index % 2 === 0 || index >= 25 },
    ]);

    expect(plateauOf(records)).toBeUndefined();
  });

  it("finds no plateau when the setting played most sits above the span", () => {
    const records = career([
      { count: 20, pieceCount: 6, memorizeSeconds: 10 },
      { count: 30, pieceCount: 8, memorizeSeconds: 10, full: () => false },
    ]);

    expect(deriveLab({ records, summary: summarize(records), today: "" }).span.value?.pieceCount).toBe(6);
    expect(plateauOf(records)).toBeUndefined();
  });
});

describe("faster but less accurate rule", () => {
  it("finds a quicker rebuild per piece with accuracy down over the same rounds", () => {
    const rounds = daily(20, (index) => (index < 10 ? { full: true, solveMs: 20_000 } : { full: false, solveMs: 12_000 }));

    expect(insightsOf(rounds).value?.insights).toEqual([
      {
        ruleId: "fasterLessAccurate",
        params: { source: "game", pieceCount: 4, memorizeSeconds: 10, faster: 1, fell: 25 },
        action: { kind: "rig", pieceCount: 4, memorizeSeconds: 10 },
        strength: 3.33,
      },
    ]);
  });

  it("finds nothing under 20 rounds, under 0.3 s faster, or with accuracy down under 5 points", () => {
    const slower = (count: number, laterMs: number, laterFull: (index: number) => boolean) =>
      daily(count, (index) => (index < count - 10 ? { full: true, solveMs: 20_000 } : { full: laterFull(index), solveMs: laterMs }));

    expect(ids(insightsOf(slower(19, 12_000, () => false)))).toEqual([]);
    expect(ids(insightsOf(slower(20, 14_400, () => false)))).toEqual([]);
    expect(ids(insightsOf(slower(20, 12_000, (index) => index !== 19)))).toEqual([]);
  });
});

describe("insight ranking", () => {
  it("keeps the three strongest by priority, then by how far each is past its threshold", () => {
    const rounds = daily(20, (index) => (index < 10 ? { full: true, solveMs: 20_000 } : { full: false, solveMs: 12_000 }));
    const result = insightsOf(rounds, {
      ...squares([8, 0, 0, 4, 4, 0, 0, 8]),
      typeShown: { k: 40, q: 20 },
      typeMissed: { q: 12 },
      colorShown: { w: 100, b: 100 },
      colorMissed: { w: 10, b: 18 },
    });

    expect(ids(result)).toEqual(["weakType", "edgeFiles", "fasterLessAccurate"]);
  });

  /** Plateau cannot fire beside fasterLessAccurate: one needs accuracy flat and the other needs it down 5 points. */
  it("ranks an edge finding with no centre miss at 0.99, below any weak type, whose recall under half reads 1 or more", () => {
    const rounds = daily(20, (index) => (index < 10 ? { full: true, solveMs: 20_000 } : { full: false, solveMs: 12_000 }));
    const result = insightsOf(rounds, {
      ...squares([3, 0, 0, 0, 0, 0, 0, 3]),
      typeShown: { k: 40, q: 100 },
      typeMissed: { q: 51 },
      colorShown: { w: 100, b: 100 },
      colorMissed: { w: 10, b: 18 },
    });

    expect(result.value?.insights.map(({ ruleId, strength }) => [ruleId, strength])).toEqual([
      ["weakType", 1.02],
      ["edgeFiles", 0.99],
      ["fasterLessAccurate", 3.33],
    ]);
  });
});
