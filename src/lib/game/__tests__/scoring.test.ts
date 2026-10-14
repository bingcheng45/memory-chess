import { countWrong, placementFromFen, scorePlacement } from "@/lib/game/scoring";

describe("placementFromFen", () => {
  it("reads the board part of a FEN into square to piece letter", () => {
    expect(placementFromFen("r7/8/8/3q4/8/8/5N2/6K1 w - - 0 1")).toEqual({
      a8: "r",
      d5: "q",
      f2: "N",
      g1: "K",
    });
  });

  it("reads an empty board as no squares", () => {
    expect(placementFromFen("8/8/8/8/8/8/8/8")).toEqual({});
  });
});

describe("scorePlacement", () => {
  const target = { g1: "K", d6: "q", f3: "N", e5: "p" };

  it("scores a perfect rebuild as 100 with nothing wrong", () => {
    expect(scorePlacement(target, target)).toEqual({
      accuracy: 100,
      correct: 4,
      total: 4,
      extra: 0,
      missed: 0,
      totalWrong: 0,
    });
  });

  it("rounds 7 of 8 to 88", () => {
    const eight = { ...target, a1: "R", b2: "B", c3: "P", h8: "k" };
    const recalled = { ...eight, a1: "r" };

    expect(scorePlacement(eight, recalled)).toEqual({
      accuracy: 88,
      correct: 7,
      total: 8,
      extra: 0,
      missed: 1,
      totalWrong: 1,
    });
  });

  it("counts the wrong colour on the right square as a miss", () => {
    expect(scorePlacement({ g1: "K" }, { g1: "k" })).toEqual({
      accuracy: 0,
      correct: 0,
      total: 1,
      extra: 0,
      missed: 1,
      totalWrong: 1,
    });
  });

  it("takes ten points off for each piece beyond the target count", () => {
    expect(scorePlacement(target, { ...target, a1: "N", h8: "q" })).toEqual({
      accuracy: 80,
      correct: 4,
      total: 4,
      extra: 2,
      missed: 0,
      totalWrong: 2,
    });
  });

  it("never reports below zero", () => {
    const flood = Object.fromEntries(
      ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b1", "b2"].map((square) => [square, "N"]),
    );

    expect(scorePlacement(target, flood).accuracy).toBe(0);
  });

  it("counts half a position recalled as three wrong, not zero", () => {
    const six = { a1: "K", h8: "k", c3: "P", d4: "p", e5: "N", f6: "b" };
    const half = { a1: "K", h8: "k", c3: "P" };

    expect(scorePlacement(six, half)).toMatchObject({ correct: 3, missed: 3, extra: 0, totalWrong: 3 });
  });

  it("scores an empty target as 0 rather than NaN", () => {
    expect(scorePlacement({}, {}).accuracy).toBe(0);
  });
});

describe("countWrong", () => {
  it("adds missed and extra pieces", () => {
    expect(countWrong({ total: 6, correct: 4, extra: 1 })).toBe(3);
  });
});
