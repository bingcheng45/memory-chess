import { removeFromSummary, summarize } from "@/lib/lab/summary";
import { reviewedBoard, roundV2, TARGET } from "./fixtures";

const HALF = "4k3/8/8/8/8/8/8/4K3";
const day = (date: string, hour: number) => ({ endedAt: Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00Z`), localDay: date });

describe("removeFromSummary", () => {
  it("leaves the counters a record without the round would have", () => {
    const first = roundV2({ id: "a", ...day("2026-10-06", 12), placedFen: HALF });
    const last = roundV2({ id: "b", ...day("2026-10-07", 12), pieceCount: 7, targetFen: "r3k3/8/8/3q4/8/5N2/PP6/4K3", placedFen: "r3k3/8/8/8/8/5B2/P7/4K2R" });

    expect(removeFromSummary(summarize([first, last]), last, [first])).toEqual(summarize([first]));
  });

  it("gives a setting back the best the removed round replaced, one round fewer", () => {
    const first = roundV2({ id: "a", ...day("2026-10-07", 9), placedFen: HALF, solveMs: 15000 });
    const last = roundV2({ id: "b", ...day("2026-10-07", 12), placedFen: TARGET });

    const { bests, rounds, days } = removeFromSummary(summarize([first, last]), last, [first]);

    expect({ bests, rounds, days }).toEqual({
      bests: { "game:4x10": { accuracy: 50, correct: 2, solveMs: 15000, at: Date.parse("2026-10-07T09:00:00Z"), rounds: 1 } },
      rounds: 1,
      days: ["2026-10-07"],
    });
  });

  it("drops the setting and the day the only round added", () => {
    const only = roundV2({ id: "a", ...day("2026-10-07", 12) });

    const { bests, rounds, days } = removeFromSummary(summarize([only]), only, []);

    expect({ bests, rounds, days }).toEqual({ bests: {}, rounds: 0, days: [] });
  });

  it("takes back only the round and the day of a review, which added no best", () => {
    const seen = roundV2({ id: "a", ...day("2026-10-06", 12) });
    const review = reviewedBoard("b", "2026-10-07", seen, 1);

    expect(removeFromSummary(summarize([seen, review]), review, [seen])).toEqual(summarize([seen]));
  });
});
