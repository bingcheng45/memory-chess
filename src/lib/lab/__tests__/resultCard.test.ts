import { deriveLab, type LabResults } from "@/lib/lab/metrics";
import type { Insight } from "@/lib/lab/insights";
import type { RoundRecord } from "@/lib/lab/record";
import { resultCardFor, summaryCounts, type ResultCardInput } from "@/lib/lab/resultCard";
import { summarize } from "@/lib/lab/summary";
import { round } from "./fixtures";

const TODAY = "2026-10-07";

interface Played {
  readonly pieces?: number;
  readonly seconds?: number;
  readonly accuracy: number;
  readonly solveMs?: number;
  /** Day of October 2026. */
  readonly day?: number;
}

let clock = 0;
function played(id: string, { pieces = 6, seconds = 10, accuracy, solveMs = 20000, day = 7 }: Played): RoundRecord {
  clock += 1;
  const record = round({
    id,
    pieceCount: pieces,
    memorizeSeconds: seconds,
    solveMs,
    endedAt: Date.UTC(2026, 9, day, 8) + clock * 60_000,
    localDay: `2026-10-${String(day).padStart(2, "0")}`,
  });
  return { ...record, accuracy };
}

function cardAfter(records: readonly RoundRecord[], overrides: Partial<ResultCardInput> = {}) {
  const thisRound = records[records.length - 1];
  const summary = summarize(records);
  const results = deriveLab({ records, summary, today: TODAY });
  return resultCardFor({ round: thisRound, records, results, goal: 5, days: summary.days, today: TODAY, ...overrides });
}

beforeEach(() => {
  clock = 0;
});

describe("resultCardFor", () => {
  it("gives a first round only the streak and a replay of its setting", () => {
    expect(cardAfter([played("first", { accuracy: 67 })])).toEqual({
      newBest: null,
      vsRecent: null,
      spanChange: null,
      streak: { current: 1, graceUsed: false, daysThisWeek: 1, goal: 5 },
      next: { kind: "again", setting: { pieceCount: 6, memorizeSeconds: 10 } },
    });
  });

  it("names a new best with the best it replaced, and points one piece up after 90% or more", () => {
    const card = cardAfter([played("a", { accuracy: 85, day: 5 }), played("b", { accuracy: 80, day: 6 }), played("c", { accuracy: 92 })]);

    expect(card).toEqual({
      newBest: { setting: { pieceCount: 6, memorizeSeconds: 10 }, accuracy: 92, previousAccuracy: 85, fasterBy: null },
      vsRecent: null,
      spanChange: null,
      streak: { current: 3, graceUsed: false, daysThisWeek: 3, goal: 5 },
      next: { kind: "more", setting: { pieceCount: 7, memorizeSeconds: 10 } },
    });
  });

  it("counts a matched accuracy rebuilt faster as a new best and says by how much", () => {
    const card = cardAfter([played("a", { accuracy: 85, solveMs: 20000 }), played("b", { accuracy: 85, solveMs: 18800 })]);

    expect(card?.newBest).toEqual({ setting: { pieceCount: 6, memorizeSeconds: 10 }, accuracy: 85, previousAccuracy: 85, fasterBy: 1.2 });
  });

  it("claims no best when the round only matched the old best at the same speed or slower", () => {
    expect(cardAfter([played("a", { accuracy: 85, solveMs: 20000 }), played("b", { accuracy: 85, solveMs: 20000 })])?.newBest).toBeNull();
    expect(cardAfter([played("a", { accuracy: 85 }), played("b", { accuracy: 70 })])?.newBest).toBeNull();
  });

  it("keeps bests apart by setting, so a first round at a new setting is no best", () => {
    expect(cardAfter([played("a", { accuracy: 50 }), played("b", { accuracy: 100, seconds: 5 })])?.newBest).toBeNull();
  });

  it("leaves out the old best when earlier rounds at the setting have left the log", () => {
    const all = [played("old", { accuracy: 88, day: 1 }), played("a", { accuracy: 80, day: 6 }), played("b", { accuracy: 90 })];
    const records = all.slice(1);
    const summary = summarize(all);
    const results = deriveLab({ records, summary, today: TODAY });

    expect(resultCardFor({ round: all[2], records, results, goal: 5, days: summary.days, today: TODAY })?.newBest).toEqual({
      setting: { pieceCount: 6, memorizeSeconds: 10 },
      accuracy: 90,
      previousAccuracy: null,
      fasterBy: null,
    });
  });

  it("compares with the earlier rounds at the setting from three of them, and with five at most", () => {
    const three = [played("a", { accuracy: 80 }), played("b", { accuracy: 82 }), played("c", { accuracy: 84 }), played("d", { accuracy: 70 })];
    expect(cardAfter(three)?.vsRecent).toEqual({ points: -12, rounds: 3 });

    clock = 0;
    const seven = [10, 10, 70, 72, 74, 76, 78, 80].map((accuracy, index) => played(`r${index}`, { accuracy }));
    expect(cardAfter(seven)?.vsRecent).toEqual({ points: 6, rounds: 5 });
  });

  it("leaves the comparison out with two earlier rounds, and ignores rounds at other settings", () => {
    const records = [played("x", { accuracy: 10, pieces: 8 }), played("y", { accuracy: 10, pieces: 8 }), played("a", { accuracy: 80 }), played("b", { accuracy: 82 }), played("c", { accuracy: 90 })];

    expect(cardAfter(records)?.vsRecent).toBeNull();
  });

  it("names the span this round raised, and nothing when it held", () => {
    const records = [played("a", { accuracy: 90, pieces: 7 }), played("b", { accuracy: 90, pieces: 7 }), played("c", { accuracy: 85, pieces: 8 }), played("d", { accuracy: 82, pieces: 8 })];

    expect(cardAfter(records)?.spanChange).toEqual({ to: 8 });
    expect(cardAfter(records.slice(0, 3))?.spanChange).toBeNull();
  });

  it("names a first span as a rise from none", () => {
    const records = [played("a", { accuracy: 80, pieces: 5 }), played("b", { accuracy: 100, pieces: 5 })];

    expect(cardAfter(records)?.spanChange).toEqual({ to: 5 });
  });

  it("reports a forgiven day and counts this week's days from Monday", () => {
    const records = [played("a", { accuracy: 60, day: 4 }), played("b", { accuracy: 60, day: 6 }), played("c", { accuracy: 60 })];

    expect(cardAfter(records, { goal: 3 })?.streak).toEqual({ current: 3, graceUsed: true, daysThisWeek: 2, goal: 3 });
  });

  it("points one piece down after under 50%, but never below three pieces or above the largest board", () => {
    expect(cardAfter([played("a", { accuracy: 40 })])?.next).toEqual({ kind: "fewer", setting: { pieceCount: 5, memorizeSeconds: 10 } });
    expect(cardAfter([played("b", { accuracy: 49, pieces: 3 })])?.next).toEqual({ kind: "again", setting: { pieceCount: 3, memorizeSeconds: 10 } });
    expect(cardAfter([played("c", { accuracy: 50 })])?.next).toEqual({ kind: "again", setting: { pieceCount: 6, memorizeSeconds: 10 } });
    expect(cardAfter([played("d", { accuracy: 100, pieces: 32 })])?.next).toEqual({ kind: "again", setting: { pieceCount: 32, memorizeSeconds: 10 } });
    expect(cardAfter([played("e", { accuracy: 90, seconds: 5 })])?.next).toEqual({ kind: "more", setting: { pieceCount: 7, memorizeSeconds: 5 } });
  });

  it("puts the engine's top finding first, ahead of the accuracy rules", () => {
    const records = [played("a", { accuracy: 100 })];
    const derived = deriveLab({ records, summary: summarize(records), today: TODAY });
    const insight: Insight = { ruleId: "plateau", params: { span: 6 }, action: { kind: "rig", pieceCount: 7, memorizeSeconds: 10 }, strength: 1 };
    const results: LabResults = { ...derived, insights: { readiness: { state: "ready", sampleSize: 12 }, value: { insights: [insight] } } };

    expect(resultCardFor({ round: records[0], records, results, goal: 5, days: summarize(records).days, today: TODAY })?.next).toEqual({ kind: "insight", insight });
  });

  it("has no card until the record holds the round's day", () => {
    const records = [played("a", { accuracy: 80 })];
    const results = deriveLab({ records: [], summary: summarize([]), today: TODAY });

    expect(resultCardFor({ round: records[0], records, results, goal: 5, days: [], today: TODAY })).toBeNull();
  });

  it("counts the week from the summary's days, which outlive rounds that have left the log", () => {
    const evicted = [played("mon", { accuracy: 70, day: 5 }), played("tue", { accuracy: 70, day: 6 })];
    const records = [played("now", { accuracy: 80 })];
    const summary = summarize([...evicted, ...records]);
    const results = deriveLab({ records, summary, today: TODAY });

    expect(resultCardFor({ round: records[0], records, results, goal: 5, days: summary.days, today: TODAY })?.streak.daysThisWeek).toBe(3);
  });
});

describe("summaryCounts", () => {
  beforeEach(() => {
    clock = 0;
  });

  it("is true once the summary holds the round's day and a best the round does not beat", () => {
    const records = [played("a", { accuracy: 90, day: 6 }), played("b", { accuracy: 80 })];

    expect(summaryCounts(summarize(records), records[1])).toBe(true);
  });

  it("is false while the summary still holds a best this round beats", () => {
    const earlier = played("a", { accuracy: 70 });
    const now = played("b", { accuracy: 90 });

    expect(summaryCounts(summarize([earlier]), now)).toBe(false);
  });

  it("is false while the summary has not counted the round's day", () => {
    const earlier = played("a", { accuracy: 90, day: 6 });
    const now = played("b", { accuracy: 80 });

    expect(summaryCounts(summarize([earlier]), now)).toBe(false);
  });

  it("is false while the summary has no best at the round's setting", () => {
    const other = played("a", { accuracy: 90, pieces: 4 });
    const now = played("b", { accuracy: 80 });

    expect(summaryCounts(summarize([other]), now)).toBe(false);
  });
});
