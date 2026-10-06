import {
  generatePosition,
  roundReducer,
  scoreReading,
  squareVerdict,
  suggestTier,
  type LabPosition,
  type RoundState,
} from "@/lib/home/calibration";

const WK = { color: "white", type: "king" } as const;
const BQ = { color: "black", type: "queen" } as const;
const WN = { color: "white", type: "knight" } as const;
const BP = { color: "black", type: "pawn" } as const;

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe("generatePosition", () => {
  it("places the requested number of pieces on distinct squares with exactly one king", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const position = generatePosition(seeded(seed), 6);
      const pieces = Object.values(position);

      expect(pieces).toHaveLength(6);
      expect(pieces.filter((piece) => piece?.type === "king")).toHaveLength(1);
    }
  });

  it("never puts a pawn on the first or eighth rank", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const position = generatePosition(seeded(seed), 16);
      const backRankPawns = Object.entries(position).filter(
        ([square, piece]) => piece?.type === "pawn" && /[18]$/.test(square),
      );

      expect(backRankPawns).toEqual([]);
    }
  });

  it("is deterministic for a given random source", () => {
    expect(generatePosition(seeded(42))).toEqual(generatePosition(seeded(42)));
  });
});

describe("scoreReading", () => {
  const target: LabPosition = { g1: WK, d6: BQ, f3: WN, e5: BP };

  it("scores a perfect rebuild as 100", () => {
    expect(scoreReading(target, target)).toEqual({
      accuracy: 100,
      correct: 4,
      total: 4,
      wrong: 0,
      byType: [
        { type: "king", correct: 1, total: 1 },
        { type: "queen", correct: 1, total: 1 },
        { type: "knight", correct: 1, total: 1 },
        { type: "pawn", correct: 1, total: 1 },
      ],
    });
  });

  it("counts a piece on the wrong square as one miss and one wrong placement", () => {
    const score = scoreReading(target, { g1: WK, d6: BQ, e3: WN, e5: BP });

    expect(score.accuracy).toBe(75);
    expect(score.correct).toBe(3);
    expect(score.wrong).toBe(1);
    expect(score.byType).toContainEqual({ type: "knight", correct: 0, total: 1 });
  });

  it("treats the wrong colour on the right square as a miss", () => {
    const score = scoreReading(target, { g1: { color: "black", type: "king" } });

    expect(score.correct).toBe(0);
    expect(score.wrong).toBe(1);
    expect(score.accuracy).toBe(0);
  });

  it("takes ten points off for each piece placed beyond the target count", () => {
    const placed: LabPosition = { ...target, a1: WN, h8: BQ };

    expect(scoreReading(target, placed).accuracy).toBe(80);
  });

  it("never reports below zero", () => {
    const placed: LabPosition = {
      a1: WN, a2: WN, a3: WN, a4: WN, a5: WN, a6: WN, a7: WN, a8: WN,
      b1: WN, b2: WN, b3: WN, b4: WN, b5: WN, b6: WN, b7: WN, b8: WN,
    };

    expect(scoreReading(target, placed).accuracy).toBe(0);
  });

  it("matches the microscope example: 7 of 8 squares reads 88", () => {
    const eight: LabPosition = {
      g1: WK, f2: { color: "white", type: "pawn" }, g2: { color: "white", type: "pawn" },
      h2: { color: "white", type: "pawn" }, f3: WN, d8: { color: "black", type: "rook" },
      d6: BQ, c4: { color: "white", type: "bishop" },
    };
    const recalled: LabPosition = { ...eight, f3: undefined, e3: WN };

    expect(scoreReading(eight, recalled).accuracy).toBe(88);
  });
});

describe("squareVerdict", () => {
  const target: LabPosition = { g1: WK, f3: WN };
  const placed: LabPosition = { g1: WK, e3: WN, f3: BP };

  it.each([
    ["g1", "ok"],
    ["e3", "wrong"],
    ["f3", "wrong miss"],
    ["a1", undefined],
  ] as const)("reads %s as %s", (square, verdict) => {
    expect(squareVerdict(target, placed, square)).toBe(verdict);
  });

  it("marks an unrecalled target square as a plain miss", () => {
    expect(squareVerdict(target, {}, "f3")).toBe("miss");
  });
});

describe("suggestTier", () => {
  it.each([
    [100, "stepUp", "hard", 12, 8],
    [90, "stepUp", "hard", 12, 8],
    [89, "stay", "medium", 6, 10],
    [60, "stay", "medium", 6, 10],
    [59, "start", "easy", 2, 10],
    [0, "start", "easy", 2, 10],
  ])("maps %i%% to %s on %s", (accuracy, advice, difficulty, pieceCount, memorizeTime) => {
    expect(suggestTier(accuracy)).toEqual({ advice, difficulty, pieceCount, memorizeTime });
  });
});

describe("roundReducer", () => {
  const target: LabPosition = { g1: WK, d6: BQ };

  function rebuilding(): RoundState {
    const studying = roundReducer({ phase: "idle" }, { type: "start", target });
    return roundReducer(studying, { type: "studyEnded", now: 1000 });
  }

  it("clears the board when the study window ends", () => {
    expect(rebuilding()).toEqual({
      phase: "rebuild",
      target,
      placed: {},
      selected: null,
      startedAt: 1000,
    });
  });

  it("places the selected piece, and a second tap with it lifts the piece again", () => {
    const selected = roundReducer(rebuilding(), { type: "select", piece: WK });
    const placed = roundReducer(selected, { type: "tapSquare", square: "g1" });
    const lifted = roundReducer(placed, { type: "tapSquare", square: "g1" });

    expect(placed).toMatchObject({ placed: { g1: WK } });
    expect(lifted).toMatchObject({ placed: {} });
  });

  it("swaps a placed piece for a different selected one", () => {
    const withKing = roundReducer(
      roundReducer(rebuilding(), { type: "select", piece: WK }),
      { type: "tapSquare", square: "g1" },
    );
    const swapped = roundReducer(
      roundReducer(withKing, { type: "select", piece: BQ }),
      { type: "tapSquare", square: "g1" },
    );

    expect(swapped).toMatchObject({ placed: { g1: BQ } });
  });

  it("ignores a tap on an empty square with nothing selected", () => {
    const state = rebuilding();

    expect(roundReducer(state, { type: "tapSquare", square: "a1" })).toBe(state);
  });

  it("toggles the palette selection off when the same piece is picked twice", () => {
    const once = roundReducer(rebuilding(), { type: "select", piece: BQ });
    const twice = roundReducer(once, { type: "select", piece: BQ });

    expect(once).toMatchObject({ selected: BQ });
    expect(twice).toMatchObject({ selected: null });
  });

  it("scores on submit and records the rebuild time", () => {
    const placed = roundReducer(
      roundReducer(rebuilding(), { type: "select", piece: WK }),
      { type: "tapSquare", square: "g1" },
    );
    const scored = roundReducer(placed, { type: "submit", now: 13500 });

    expect(scored).toMatchObject({
      phase: "scored",
      rebuildMs: 12500,
      score: { accuracy: 50, correct: 1, total: 2, wrong: 0 },
    });
  });

  it("ignores placement before the board clears", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", target });

    expect(roundReducer(studying, { type: "tapSquare", square: "g1" })).toBe(studying);
  });
});
