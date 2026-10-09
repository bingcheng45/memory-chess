import { computeCurve } from "@/lib/lab/curve";
import type { RoundRecord } from "@/lib/lab/record";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { reviewedBoard, seenBoard } from "./fixtures";

/** Four distinct 4-piece boards: both kings and two more pieces on rank 4. */
const BOARDS = ["4k3/8/8/8/Q6p/8/8/4K3", "4k3/8/8/8/1R4p1/8/8/4K3", "4k3/8/8/8/2B2p2/8/8/4K3", "4k3/8/8/8/3N1p2/8/8/4K3"];
/** Only the two kings back: 50% of a 4-piece board. */
const KINGS = "4k3/8/8/8/8/8/8/4K3";

const firstSights = BOARDS.map((fen, index) => seenBoard(`b${index}`, "2026-10-01", fen, KINGS));

const curveOf = (records: readonly RoundRecord[], today = "2026-10-08") => computeCurve({ records, summary: summarize(records), today });

describe("the measured forgetting curve", () => {
  it("is empty with no rounds, so the panel keeps its illustrative model", () => {
    expect(computeCurve({ records: [], summary: EMPTY_SUMMARY, today: "2026-10-08" })).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("is warming until one delay has three reviews, and says how many more", () => {
    const records = [...firstSights, reviewedBoard("r0", "2026-10-02", firstSights[0], 1), reviewedBoard("r1", "2026-10-02", firstSights[1], 1)];

    expect(curveOf(records).readiness).toEqual({ state: "warming", sampleSize: 2, need: { reviews: 1 } });
  });

  it("plots first sight and each delay with three or more reviews behind it, each with its count", () => {
    const records = [
      ...firstSights,
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d1-${index}`, "2026-10-02", first, 1)),
      ...firstSights.slice(0, 2).map((first, index) => reviewedBoard(`d3-${index}`, "2026-10-04", first, 3, KINGS)),
    ];

    expect(curveOf(records)).toEqual({
      readiness: { state: "ready", sampleSize: 5 },
      value: { points: [{ day: 0, accuracy: 50, count: 3 }, { day: 1, accuracy: 100, count: 3 }], reviews: 5, boards: 3 },
    });
  });

  it("files a late review under the step it was due at, the longest delay it has passed, and anything past two weeks under 14 days", () => {
    const records = [
      ...firstSights,
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d2-${index}`, "2026-10-03", first, 2)),
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d5-${index}`, "2026-10-06", first, 5, KINGS)),
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d20-${index}`, "2026-10-21", first, 20)),
    ];

    expect(curveOf(records, "2026-10-21").value?.points.map(({ day, accuracy }) => [day, accuracy])).toEqual([[0, 50], [1, 100], [3, 50], [14, 100]]);
  });

  it("keeps the on-time review that follows a late one, since the queue schedules it as the next step", () => {
    const records = [
      ...firstSights,
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d5-${index}`, "2026-10-06", first, 5, KINGS)),
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d7-${index}`, "2026-10-08", first, 7)),
    ];

    expect(curveOf(records).value?.points).toEqual([
      { day: 0, accuracy: 50, count: 3 },
      { day: 3, accuracy: 50, count: 3 },
      { day: 7, accuracy: 100, count: 3 },
    ]);
  });

  it("counts only the first review of a board at each delay, so a repeat the same day cannot lift the point", () => {
    const records = [
      ...firstSights,
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d1-${index}`, "2026-10-02", first, 1, KINGS)),
      ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d1-again-${index}`, "2026-10-02", first, 1)),
    ];

    expect(curveOf(records).value?.points).toEqual([{ day: 0, accuracy: 50, count: 3 }, { day: 1, accuracy: 50, count: 3 }]);
  });

  it("reads first sight only from the round that first showed a board, never from a later fresh round of it", () => {
    const repeats = firstSights.slice(0, 3).map((first, index) => seenBoard(`again-${index}`, "2026-10-01", first.targetFen, first.targetFen));
    const records = [...firstSights, ...repeats, ...firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d1-${index}`, "2026-10-02", first, 1))];

    expect(curveOf(records).value?.points[0]).toEqual({ day: 0, accuracy: 50, count: 3 });
  });

  it("keeps the reviews of boards whose first round has left the log, but cannot place their first sight", () => {
    const reviews = firstSights.slice(0, 3).map((first, index) => reviewedBoard(`d1-${index}`, "2026-10-02", first, 1));

    expect(curveOf(reviews).value).toEqual({ points: [{ day: 1, accuracy: 100, count: 3 }], reviews: 3, boards: 3 });
  });
});
