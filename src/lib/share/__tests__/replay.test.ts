import { labPositionFromFen } from "@/lib/round/round";
import { advance, markCounts, piecesDown, replayBoard, replayPhases, REPLAY_START, type ReplayCursor, type ReplayRound } from "@/lib/share/replay";

const ROUND: ReplayRound = {
  board: {
    target: labPositionFromFen("4k3/8/8/3q4/8/8/4P3/4K3"),
    placed: labPositionFromFen("4k3/8/8/8/8/8/8/R3K3"),
    order: [
      { square: "e1", seconds: 3.1 },
      { square: "e8", seconds: 5 },
      { square: "a1", seconds: 12.4 },
    ],
  },
  studySeconds: 8.4,
  rebuildSeconds: 38.3,
};
const UNORDERED: ReplayRound = { ...ROUND, board: { ...ROUND.board, order: null } };

describe("advance", () => {
  it.each([
    ["within study", 4, { phase: "study", elapsed: 4 }],
    ["to the end of study and no further", 8.4, { phase: "study", elapsed: 8.4 }],
    ["past study into the cleared board", 9, { phase: "clear", elapsed: 0.6 }],
    ["past the cleared board into the rebuild", 14.4, { phase: "rebuild", elapsed: 5 }],
    ["past the rebuild to the score, where it holds", 1000, { phase: "scored", elapsed: 0 }],
  ])("moves a replay from the start %s", (_, seconds, cursor) => {
    const { phase, elapsed } = advance(ROUND, REPLAY_START, seconds);

    expect({ phase, elapsed: Math.round(elapsed * 10) / 10 }).toEqual(cursor);
  });

  it("goes from the cleared board to the score when the round's order is unknown", () => {
    expect(replayPhases(UNORDERED)).toEqual(["study", "clear", "scored"]);
    expect(advance(UNORDERED, { phase: "clear", elapsed: 0.5 }, 1)).toEqual({ phase: "scored", elapsed: 0 });
  });
});

describe("replayBoard", () => {
  const shown = (round: ReplayRound, cursor: ReplayCursor) =>
    Object.fromEntries(Object.entries(replayBoard(round, cursor)).filter(([, square]) => square.piece || square.ghost || square.mark));

  it("shows the target while the player studies it", () => {
    expect(Object.keys(shown(ROUND, { phase: "study", elapsed: 2 })).sort()).toEqual(["d5", "e1", "e2", "e8"]);
  });

  it("shows an empty board once it is cleared", () => {
    expect(shown(ROUND, { phase: "clear", elapsed: 0.5 })).toEqual({});
  });

  it("puts down the pieces the order reached by the rebuild's clock, numbered as they went down", () => {
    expect(shown(ROUND, { phase: "rebuild", elapsed: 5 })).toEqual({
      e1: { piece: { color: "white", type: "king" }, turn: 1 },
      e8: { piece: { color: "black", type: "king" }, turn: 2 },
    });
    expect(piecesDown(ROUND, { phase: "rebuild", elapsed: 4.9 }).map(({ square }) => square)).toEqual(["e1"]);
  });

  it("ends on the scored board: what was placed, a faint piece where one was missed, every square marked", () => {
    expect(shown(ROUND, { phase: "scored", elapsed: 0 })).toEqual({
      a1: { piece: { color: "white", type: "rook" }, mark: "wrong" },
      d5: { ghost: { color: "black", type: "queen" }, mark: "miss" },
      e2: { ghost: { color: "white", type: "pawn" }, mark: "miss" },
      e1: { piece: { color: "white", type: "king" }, mark: "ok" },
      e8: { piece: { color: "black", type: "king" }, mark: "ok" },
    });
  });
});

describe("markCounts", () => {
  it("counts the scored board's marks as the legend names them", () => {
    expect(markCounts(ROUND.board)).toEqual({ correct: 2, missed: 2, wrong: 1 });
  });
});
