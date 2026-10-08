import { addToSummary, EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { round } from "./fixtures";

/**
 * Black rook a8, black king e8, black queen d5, white knight f3, white pawns a2 and b2, white king e1. The rebuild
 * keeps the rook, the a2 pawn and both kings, drops the queen and the b2 pawn, puts a bishop on f3 and adds a rook on h1.
 */
const TARGET = "r3k3/8/8/3q4/8/5N2/PP6/4K3";
const PLACED = "r3k3/8/8/8/8/5B2/P7/4K2R";
const mixed = (id: string) => round({ id, pieceCount: 7, targetFen: TARGET, placedFen: PLACED });

describe("lifetime colour counts", () => {
  it("count each non-king piece shown and missed by its colour, a wrong piece as a miss and an extra piece as nothing", () => {
    const summary = summarize([mixed("a")]);

    expect(summary).toMatchObject({ v: 3, colorShown: { w: 3, b: 2 }, colorMissed: { w: 2, b: 1 } });
  });

  it("add up over rounds", () => {
    const summary = addToSummary(addToSummary(EMPTY_SUMMARY, mixed("a")), round({ id: "b" }));

    expect([summary.colorShown, summary.colorMissed]).toEqual([{ w: 4, b: 3 }, { w: 2, b: 1 }]);
  });
});
