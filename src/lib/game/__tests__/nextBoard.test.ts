import { nextBoardOf } from "@/lib/game/nextBoard";

describe("nextBoardOf", () => {
  it("adds a piece after 90% or more, drops one under 50%, never below three pieces or above the largest board, and keeps the study time", () => {
    expect([
      nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 92),
      nextBoardOf({ pieceCount: 6, memorizeSeconds: 5 }, 90),
      nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 40),
      nextBoardOf({ pieceCount: 3, memorizeSeconds: 10 }, 49),
      nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 50),
      nextBoardOf({ pieceCount: 32, memorizeSeconds: 10 }, 100),
    ]).toEqual([
      { pieceCount: 7, memorizeSeconds: 10 },
      { pieceCount: 7, memorizeSeconds: 5 },
      { pieceCount: 5, memorizeSeconds: 10 },
      { pieceCount: 3, memorizeSeconds: 10 },
      { pieceCount: 6, memorizeSeconds: 10 },
      { pieceCount: 32, memorizeSeconds: 10 },
    ]);
  });
});
