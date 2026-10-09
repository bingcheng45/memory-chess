import { deriveLab } from "@/lib/lab/metrics";
import { spanOfRounds } from "@/lib/lab/progress";
import { summaryCounts } from "@/lib/lab/resultCard";
import { summarize } from "@/lib/lab/summary";
import { reviewedBoard, seenBoard } from "./fixtures";

/** Two 6-piece boards; placing only the kings back scores 33%. */
const KINGS = "4k3/8/8/8/8/8/8/4K3";
const first = seenBoard("f1", "2026-10-01", "4k3/8/8/8/QR2p2p/8/8/4K3", KINGS, 6);
const second = seenBoard("f2", "2026-10-02", "4k3/8/8/8/RQ2p2p/8/8/4K3", KINGS, 6);
/** Both boards placed back in full on review, which a fresh round at 6 pieces would count toward the span and the best. */
const reviews = [reviewedBoard("r1", "2026-10-02", first, 1), reviewedBoard("r2", "2026-10-03", second, 1)];
const records = [first, second, ...reviews];

describe("review rounds in the rest of the record", () => {
  const lab = deriveLab({ records, summary: summarize(records), today: "2026-10-03" });

  it("count as rounds played: in the days, the streak and the sittings", () => {
    expect(summarize(records)).toMatchObject({ rounds: 4, days: ["2026-10-01", "2026-10-02", "2026-10-03"] });
    expect(lab.streak.value?.current).toBe(3);
    expect(lab.sessions.value?.sessions.reduce((sum, { rounds }) => sum + rounds, 0)).toBe(4);
  });

  it("never lift the span, since the board is one the player has seen", () => {
    expect(first.accuracy).toBe(33);
    expect(reviews.map(({ accuracy }) => accuracy)).toEqual([100, 100]);
    expect(lab.span).toEqual({
      readiness: { state: "warming", sampleSize: 2, need: { qualifyingRounds: 2 } },
      value: { pieceCount: null, memorizeSeconds: null, qualifyingRounds: 0, history: [{ endedAt: first.endedAt, pieceCount: null }, { endedAt: second.endedAt, pieceCount: null }], weekAgo: null, change: null },
    });
    expect(spanOfRounds(records)).toBeNull();
  });

  it("never set a personal best, which counts the fresh rounds only", () => {
    expect(lab.bests.value?.entries).toEqual([
      { key: "game:6x10", source: "game", pieceCount: 6, memorizeSeconds: 10, accuracy: 33, correct: 2, solveMs: 20000, at: first.endedAt, rounds: 2 },
    ]);
  });

  it("stay out of the accuracy trend and pieces held, which read fresh boards", () => {
    expect(lab.trend.readiness).toEqual({ state: "warming", sampleSize: 2, need: { rounds: 3 } });
    expect(lab.piecesHeld.readiness).toEqual({ state: "warming", sampleSize: 2, need: { rounds: 3 } });
  });

  it("are counted by the summary as soon as their day is in it, since a review has no best to wait for", () => {
    const before = summarize([first, second]);

    expect(summaryCounts(before, reviews[0])).toBe(true);
    expect(summaryCounts(before, reviews[1])).toBe(false);
    expect(summaryCounts(summarize(records), reviews[1])).toBe(true);
  });
});

describe("a review placed in full", () => {
  /** Rooks on the a and h files, queen and king on the d and e files: the fresh round puts back all but the rooks. */
  const ROOKS = "3qk2r/8/8/8/8/8/8/R2QK3";
  const NO_ROOKS = "3qk3/8/8/8/8/8/8/3QK3";
  const dayOf = (index: number) => `2026-09-${index + 10}`;
  const fresh = Array.from({ length: 10 }, (_, index) => seenBoard(`edge${index}`, dayOf(index), ROOKS, NO_ROOKS, 6));
  const replayed = fresh.map((board, index) => reviewedBoard(`replay${index}`, dayOf(index + 1), board, 1));
  const withReviews = [...fresh, ...replayed];
  const lab = deriveLab({ records: withReviews, summary: summarize(withReviews), today: "2026-09-20" });

  it("adds a round played but no sighting or miss, so the counters read the fresh rounds alone", () => {
    expect(summarize(withReviews)).toMatchObject({
      rounds: 20,
      typeShown: { k: 20, q: 20, r: 20 },
      typeMissed: { r: 20 },
      colorShown: { w: 20, b: 20 },
      colorMissed: { w: 10, b: 10 },
    });
  });

  it("leaves the edge files insight and the rook's recall as the fresh rounds measured them", () => {
    expect(lab.insights.value?.insights.find(({ ruleId }) => ruleId === "edgeFiles")?.params).toEqual({
      times: 0,
      edge: 100,
      centre: 0,
      edgeShown: 20,
      centreShown: 40,
    });
    expect(lab.typeRecall.value?.types.find(({ type }) => type === "r")).toEqual({ type: "r", shown: 20, recalled: 0, ready: true });
  });
});
