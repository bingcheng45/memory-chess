import { deriveLab } from "@/lib/lab/metrics";
import type { RoundRecord } from "@/lib/lab/record";
import { type LabSummary, summarize } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const NO_QUEEN = "4k3/8/8/8/8/5N2/8/4K3";
const at = (day: number, minute = 0) => Date.UTC(2026, 8, day, 12, minute);

const notebookEntries = (records: readonly RoundRecord[], summary: LabSummary) =>
  deriveLab({ records, summary, today: "" }).notebook.value?.entries ?? [];

function played(id: string, day: number, minute: number, full: boolean, solveMs = 20_000): RoundRecord {
  return round({ id, endedAt: at(day, minute), localDay: `2026-09-${String(day).padStart(2, "0")}`, placedFen: full ? TARGET : NO_QUEEN, solveMs });
}

/**
 * 1 September: 75 percent. 2 September: 100 percent. 3 September: 100 percent rebuilt faster, then seven rounds at
 * 75 percent in the same sitting, so the tenth round and the span that sitting earned land on the last of them.
 */
const firstWeek = [
  played("r1", 1, 0, false),
  played("r2", 2, 0, true),
  played("r3", 3, 0, true, 15_000),
  ...Array.from({ length: 7 }, (_, index) => played(`r${index + 4}`, 3, index + 1, false)),
];

describe("lab notebook", () => {
  it("writes each first, milestone, best, span step and streak once, newest first, with the day counted from the first round", () => {
    expect(notebookEntries(firstWeek, summarize(firstWeek))).toEqual([
      { at: at(3, 7), kind: "rounds", params: { day: 3, count: 10 } },
      { at: at(3, 7), kind: "span", params: { day: 3, from: 0, to: 4 } },
      { at: at(3), kind: "best", params: { day: 3, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 15 } },
      { at: at(3), kind: "streak", params: { day: 3, days: 3, forgiven: 0 } },
      { at: at(2), kind: "first90", params: { day: 2, pieceCount: 4 } },
      { at: at(2), kind: "best", params: { day: 2, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 75, by: "accuracy", solveSeconds: 20 } },
      { at: at(1), kind: "firstRound", params: { day: 1, pieceCount: 4, accuracy: 75 } },
    ]);
  });

  it("marks a streak milestone every time a run of days reaches it, a new run starting after two missed days", () => {
    const rounds = [1, 2, 3, 6, 7, 8].map((day) => played(`d${day}`, day, 0, false));

    expect(notebookEntries(rounds, summarize(rounds)).filter(({ kind }) => kind === "streak")).toEqual([
      { at: at(8), kind: "streak", params: { day: 8, days: 3, forgiven: 0 } },
      { at: at(3), kind: "streak", params: { day: 3, days: 3, forgiven: 0 } },
    ]);
  });

  it("carries a run over one forgiven day, counting only the days played and saying how many were forgiven", () => {
    const rounds = [1, 2, 4, 5, 6, 7, 8, 9].map((day) => played(`d${day}`, day, 0, false));

    expect(notebookEntries(rounds, summarize(rounds)).filter(({ kind }) => kind === "streak")).toEqual([
      { at: at(8), kind: "streak", params: { day: 8, days: 7, forgiven: 1 } },
      { at: at(4), kind: "streak", params: { day: 4, days: 3, forgiven: 1 } },
    ]);
  });

  it("marks a milestone for a new run that starts below the count of the run before it", () => {
    const rounds = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14].map((day) => played(`d${day}`, day, 0, false));

    expect(notebookEntries(rounds, summarize(rounds)).filter(({ kind }) => kind === "streak")).toEqual([
      { at: at(14), kind: "streak", params: { day: 14, days: 7, forgiven: 1 } },
      { at: at(10), kind: "streak", params: { day: 10, days: 3, forgiven: 1 } },
      { at: at(8), kind: "streak", params: { day: 8, days: 7, forgiven: 1 } },
      { at: at(3), kind: "streak", params: { day: 3, days: 3, forgiven: 0 } },
    ]);
  });

  it("keeps only the newest 20 entries", () => {
    const rounds = Array.from({ length: 120 }, (_, index) => played(`p${index}`, 1, index, index % 2 === 1, 20_000 - index * 100));

    const entries = notebookEntries(rounds, summarize(rounds));

    expect(entries.map(({ kind }) => kind)).toEqual([
      "span", "best", "best", "best", "rounds", "best", "best", "best", "best", "best",
      "best", "best", "best", "rounds", "best", "best", "best", "best", "best", "best",
    ]);
    expect(entries[1]).toEqual({ at: at(1, 115), kind: "best", params: { day: 1, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 8.5 } });
    expect(entries.at(-1)).toEqual({ at: at(1, 19), kind: "best", params: { day: 1, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 18.1 } });
  });

  it("writes a best only for a point more accuracy, or the same accuracy rebuilt at least half a second faster than the last best written", () => {
    const rounds = [
      played("b1", 1, 0, true, 20_000),
      played("b2", 1, 1, true, 19_600),
      played("b3", 1, 2, true, 19_500),
      played("b4", 1, 3, true, 19_100),
    ];

    expect(notebookEntries(rounds, summarize(rounds)).filter(({ kind }) => kind === "best")).toEqual([
      { at: at(1, 2), kind: "best", params: { day: 1, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 19.5 } },
    ]);
  });

  it("writes no first reading at 90 percent for the very first round, which has its own entry", () => {
    const rounds = [played("f1", 1, 0, true), played("f2", 1, 1, true)];

    expect(notebookEntries(rounds, summarize(rounds)).map(({ kind }) => kind)).toEqual(["span", "firstRound"]);
  });

  it("writes only round counts and streaks when older rounds were evicted, and counts the evicted rounds in", () => {
    const kept = firstWeek.slice(3);
    const lifetime = { ...summarize(firstWeek), evictedThrough: at(3) };

    expect(notebookEntries(kept, lifetime)).toEqual([
      { at: at(3, 7), kind: "rounds", params: { day: 3, count: 10 } },
      { at: at(3, 1), kind: "streak", params: { day: 3, days: 3, forgiven: 0 } },
    ]);
  });

  it("says entries before the oldest kept round are not kept, when older rounds were evicted", () => {
    const kept = firstWeek.slice(3);
    const lifetime = { ...summarize(firstWeek), evictedThrough: at(3) };

    expect(deriveLab({ records: kept, summary: lifetime, today: "" }).notebook.value?.older).toEqual({ before: at(3, 1) });
    expect(deriveLab({ records: firstWeek, summary: summarize(firstWeek), today: "" }).notebook.value?.older).toBeNull();
  });

  it("claims no round count when rounds are missing with no eviction to explain them", () => {
    const kept = firstWeek.slice(3);

    expect(deriveLab({ records: kept, summary: summarize(firstWeek), today: "" }).notebook.value).toEqual({
      entries: [{ at: at(3, 1), kind: "streak", params: { day: 3, days: 3, forgiven: 0 } }],
      older: { before: null },
    });
    expect(deriveLab({ records: [], summary: summarize(firstWeek), today: "" }).notebook).toEqual({
      readiness: { state: "ready", sampleSize: 10 },
      value: { entries: [], older: { before: null } },
    });
  });

  it("drops the day and the streaks once the played days reach the 400 kept, since both would count from the wrong first day", () => {
    const earlier = Array.from({ length: 397 }, (_, index) => new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10));
    const days = [...earlier, "2026-09-01", "2026-09-02", "2026-09-03"];

    expect(notebookEntries(firstWeek, { ...summarize(firstWeek), days })).toEqual([
      { at: at(3, 7), kind: "rounds", params: { count: 10 } },
      { at: at(3, 7), kind: "span", params: { from: 0, to: 4 } },
      { at: at(3), kind: "best", params: { source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 15 } },
      { at: at(2), kind: "first90", params: { pieceCount: 4 } },
      { at: at(2), kind: "best", params: { source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 75, by: "accuracy", solveSeconds: 20 } },
      { at: at(1), kind: "firstRound", params: { pieceCount: 4, accuracy: 75 } },
    ]);
  });

  it("is empty before the first round and ready from it, as the registry reads it", () => {
    const first = [played("r1", 1, 0, false)];

    expect(deriveLab({ records: [], summary: summarize([]), today: "" }).notebook).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
    expect(deriveLab({ records: first, summary: summarize(first), today: "" }).notebook).toEqual({
      readiness: { state: "ready", sampleSize: 1 },
      value: { entries: [{ at: at(1), kind: "firstRound", params: { day: 1, pieceCount: 4, accuracy: 75 } }], older: null },
    });
  });
});
