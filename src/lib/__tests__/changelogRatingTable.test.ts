import { CHANGELOG_ENTRIES } from "@/lib/changelog";
import { STEADY_RD, challengeOf, expectedAccuracy, ratingAfter } from "@/lib/game/rating";

const SETTLED = { rating: 1200, rd: STEADY_RD, rounds: 100 };
const REBUILD_SECONDS_PER_PIECE = 2.5;
const BOARDS: Record<string, { pieceCount: number; studySeconds: number }> = {
  "Easy, 2 pieces for 10 seconds": { pieceCount: 2, studySeconds: 10 },
  "Medium, 6 pieces for 10 seconds": { pieceCount: 6, studySeconds: 10 },
  "Suggested, 7 pieces for 10 seconds": { pieceCount: 7, studySeconds: 10 },
  "Hard, 12 pieces for 8 seconds": { pieceCount: 12, studySeconds: 8 },
  "Grandmaster, 20 pieces for 5 seconds": { pieceCount: 20, studySeconds: 5 },
};

const signed = (change: number): string => (change > 0 ? `+${change}` : change < 0 ? `−${-change}` : "0");

describe("the 2.0.0 rating example table", () => {
  const table = CHANGELOG_ENTRIES.find((entry) => entry.version === "2.0.0")
    ?.groups.find((group) => group.title === "A skill rating that moves both ways")
    ?.tables?.[0];

  it("prints what the rating engine does on each board", () => {
    const rows = Object.entries(BOARDS).map(([label, board]) => {
      const round = (accuracy: number) => ({ ...board, rebuildSeconds: board.pieceCount * REBUILD_SECONDS_PER_PIECE, accuracy });
      const expected = Math.round(100 * expectedAccuracy(SETTLED.rating, challengeOf(round(100))));
      const changes = [100, 80, 50, 0].map((accuracy) => signed(ratingAfter(SETTLED, round(accuracy)).change));
      return { label, values: [`${expected}%`, ...changes] };
    });

    expect(table?.rows).toEqual(rows);
  });
});
