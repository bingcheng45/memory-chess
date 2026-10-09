import { reviewQueue } from "@/lib/lab/review";
import { round, reviewedBoard, seenBoard } from "./fixtures";

const BOARD_A = "4k3/8/8/3q4/8/5N2/8/4K3";
const BOARD_B = "4k3/8/2r5/8/8/5N2/1P6/4K3";

const HALF_A = "4k3/8/8/8/8/8/8/4K3";
const missedA = seenBoard("a", "2026-10-01", BOARD_A, HALF_A);
const NONE = new Set<string>();

describe("the review queue", () => {
  it("brings back a board scored under 80% one day after it was first seen", () => {
    expect(missedA.accuracy).toBe(50);

    expect(reviewQueue([missedA], "2026-10-01", NONE)).toEqual({ due: [], overdue: 0, queued: 1, next: "2026-10-02" });
    expect(reviewQueue([missedA], "2026-10-02", NONE)).toEqual({
      due: [{ reviewOf: "a", firstDay: "2026-10-01", step: 0, dueDay: "2026-10-02", fen: BOARD_A, pieceCount: 4, memorizeSeconds: 10 }],
      overdue: 0,
      queued: 1,
      next: null,
    });
  });

  it("leaves out boards scored 80% or better, boards of only the two kings, and rounds from before version 2", () => {
    const held = seenBoard("held", "2026-10-01", BOARD_A, BOARD_A);
    const kings = seenBoard("kings", "2026-10-01", "4k3/8/8/8/8/8/8/4K3", "8/8/8/8/8/8/8/8", 2);
    const legacy = round({ id: "legacy", localDay: "2026-10-01", targetFen: BOARD_B, placedFen: HALF_A });

    expect(reviewQueue([held, kings, legacy], "2026-10-05", NONE)).toEqual({ due: [], overdue: 0, queued: 0, next: null });
  });

  it("takes a board off the queue once reviewed and schedules the next step from the day it was first seen", () => {
    const first = reviewedBoard("a1", "2026-10-02", missedA, 1);

    expect(reviewQueue([missedA, first], "2026-10-02", NONE)).toEqual({ due: [], overdue: 0, queued: 1, next: "2026-10-04" });
    expect(reviewQueue([missedA, first], "2026-10-04", NONE).due.map(({ step, dueDay }) => [step, dueDay])).toEqual([[1, "2026-10-04"]]);
  });

  it("skips to the step after a late review's delay, and drops the board after its 14-day review", () => {
    const late = reviewedBoard("a1", "2026-10-06", missedA, 5);
    const last = reviewedBoard("a2", "2026-10-15", missedA, 14);

    expect(reviewQueue([missedA, late], "2026-10-06", NONE).next).toBe("2026-10-08");
    expect(reviewQueue([missedA, late, last], "2026-10-15", NONE)).toEqual({ due: [], overdue: 0, queued: 0, next: null });
  });

  it("counts a review played twice at one step once, so the second does not move the schedule", () => {
    const twice = [missedA, reviewedBoard("a1", "2026-10-02", missedA, 1), reviewedBoard("a1b", "2026-10-02", missedA, 1)];

    expect(reviewQueue(twice, "2026-10-02", NONE).next).toBe("2026-10-04");
  });

  it("names a due board overdue once its day has passed, and puts the longest waiting first", () => {
    const missedB = seenBoard("b", "2026-10-03", BOARD_B, HALF_A);

    const queue = reviewQueue([missedB, missedA], "2026-10-04", NONE);

    expect(queue.due.map(({ reviewOf, dueDay }) => [reviewOf, dueDay])).toEqual([["a", "2026-10-02"], ["b", "2026-10-04"]]);
    expect(queue.overdue).toBe(1);
  });

  it("spends a step opened and left without a result, so the board is not shown twice at one delay", () => {
    expect(reviewQueue([missedA], "2026-10-02", new Set(["a:0"]))).toEqual({ due: [], overdue: 0, queued: 1, next: "2026-10-04" });
  });

  it("drops a board first seen more than 28 days ago, so a long break does not come back to a pile of old boards", () => {
    expect(reviewQueue([missedA], "2026-10-29", NONE).queued).toBe(1);
    expect(reviewQueue([missedA], "2026-10-30", NONE).queued).toBe(0);
  });

  it("keeps scheduling a board whose first round has left the log, from a review's own delay", () => {
    const review = reviewedBoard("a1", "2026-10-02", missedA, 1);

    expect(reviewQueue([review], "2026-10-04", NONE).due).toMatchObject([{ reviewOf: "a", firstDay: "2026-10-01", step: 1, fen: BOARD_A }]);
  });

  it("reads a fresh round of a board seen before as a repeat, not a new first sight", () => {
    const repeat = seenBoard("a-again", "2026-10-03", BOARD_A, HALF_A);

    expect(reviewQueue([repeat, missedA], "2026-10-04", NONE).due).toMatchObject([{ reviewOf: "a", firstDay: "2026-10-01", step: 0 }]);
  });
});
