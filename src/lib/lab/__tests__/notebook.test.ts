import { deriveLab } from "@/lib/lab/metrics";
import { notebookEntries } from "@/lib/lab/notebook";
import type { RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const NO_QUEEN = "4k3/8/8/8/8/5N2/8/4K3";
const at = (day: number, minute = 0) => Date.UTC(2026, 8, day, 12, minute);

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
      { at: at(3), kind: "streak", params: { day: 3, days: 3 } },
      { at: at(2), kind: "first90", params: { day: 2, pieceCount: 4 } },
      { at: at(2), kind: "best", params: { day: 2, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 75, by: "accuracy", solveSeconds: 20 } },
      { at: at(1), kind: "firstRound", params: { day: 1, pieceCount: 4, accuracy: 75 } },
    ]);
  });

  it("marks a streak milestone every time a run of days reaches it", () => {
    const rounds = [1, 2, 3, 5, 6, 7].map((day) => played(`d${day}`, day, 0, false));

    expect(notebookEntries(rounds, summarize(rounds)).filter(({ kind }) => kind === "streak")).toEqual([
      { at: at(7), kind: "streak", params: { day: 7, days: 3 } },
      { at: at(3), kind: "streak", params: { day: 3, days: 3 } },
    ]);
  });

  it("keeps only the newest 20 entries", () => {
    const rounds = Array.from({ length: 40 }, (_, index) => played(`p${index}`, 1, index, index % 2 === 1, 20_000 - index * 100));

    const entries = notebookEntries(rounds, summarize(rounds));

    expect(entries).toHaveLength(20);
    expect(entries[0]).toEqual({ at: at(1, 39), kind: "best", params: { day: 1, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 16.1 } });
    expect(entries.at(-1)).toEqual({ at: at(1, 5), kind: "best", params: { day: 1, source: "game", pieceCount: 4, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 19.5 } });
  });

  it("writes only round counts and streaks when older rounds were evicted, and counts the evicted rounds in", () => {
    const kept = firstWeek.slice(3);
    const lifetime = { ...summarize(firstWeek), evictedThrough: at(3) };

    expect(notebookEntries(kept, lifetime)).toEqual([
      { at: at(3, 7), kind: "rounds", params: { day: 3, count: 10 } },
      { at: at(3, 1), kind: "streak", params: { day: 3, days: 3 } },
    ]);
  });

  it("is empty before the first round and ready from it, as the registry reads it", () => {
    const first = [played("r1", 1, 0, false)];

    expect(deriveLab({ records: [], summary: summarize([]), today: "" }).notebook).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
    expect(deriveLab({ records: first, summary: summarize(first), today: "" }).notebook).toEqual({
      readiness: { state: "ready", sampleSize: 1 },
      value: { entries: [{ at: at(1), kind: "firstRound", params: { day: 1, pieceCount: 4, accuracy: 75 } }] },
    });
  });
});
