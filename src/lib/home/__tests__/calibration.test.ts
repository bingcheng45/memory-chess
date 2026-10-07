import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import {
  CALIBRATION_RULES,
  labPositionFromFen,
  labPositionToFen,
  loadCalibrationPosition,
  roundReducer,
  scoreReading,
  squareVerdict,
  suggestTier,
  type LabPosition,
  type RoundAction,
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

describe("calibration positions", () => {
  it("uses the Medium preset from the game config", () => {
    expect(CALIBRATION_RULES).toEqual({ pieceCount: 6, studyMs: 10000 });
  });

  it("comes from the real generator: 200 seeds all pass the game's validator", async () => {
    for (let seed = 1; seed <= 200; seed++) {
      const position = await loadCalibrationPosition(seeded(seed));
      const fen = labPositionToFen(position!);

      // The board keeps no side to move, so either side may be the one in check.
      const legal = ["w", "b"].some((turn) => validateMemorizationPosition(`${fen} ${turn} - - 0 1`, 6).valid);

      expect(legal).toBe(true);
      expect(Object.values(position!).filter((piece) => piece?.type === "king")).toEqual([
        expect.objectContaining({ type: "king" }),
        expect.objectContaining({ type: "king" }),
      ]);
    }
  });

  it("round-trips a position through FEN", () => {
    const position: LabPosition = { a8: { color: "black", type: "rook" }, e4: WN, h1: WK };

    expect(labPositionToFen(position)).toBe("r7/8/8/8/4N3/8/8/7K");
    expect(labPositionFromFen("r7/8/8/8/4N3/8/8/7K w - - 0 1")).toEqual(position);
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
    expect(score.wrong).toBe(4);
    expect(score.accuracy).toBe(0);
  });

  it("takes ten points off for each piece placed beyond the target count", () => {
    const placed: LabPosition = { ...target, a1: WN, h8: BQ };

    expect(scoreReading(target, placed)).toMatchObject({ accuracy: 80, wrong: 2 });
  });

  it("counts missed pieces as wrong, as the real game does", () => {
    expect(scoreReading(target, { g1: WK })).toMatchObject({ correct: 1, wrong: 3 });
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
      d6: BQ, c4: { color: "black", type: "king" },
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
      log: { startedAt: 1000, placements: [], removals: 0 },
    });
  });

  it("places the selected piece, and a second tap with it lifts the piece again", () => {
    const selected = roundReducer(rebuilding(), { type: "select", piece: WK });
    const placed = roundReducer(selected, { type: "tapSquare", square: "g1", now: 2000 });
    const lifted = roundReducer(placed, { type: "tapSquare", square: "g1", now: 2000 });

    expect(placed).toMatchObject({ placed: { g1: WK } });
    expect(lifted).toMatchObject({ placed: {} });
  });

  it("swaps a placed piece for a different selected one", () => {
    const withKing = roundReducer(
      roundReducer(rebuilding(), { type: "select", piece: WK }),
      { type: "tapSquare", square: "g1", now: 2000 },
    );
    const swapped = roundReducer(
      roundReducer(withKing, { type: "select", piece: BQ }),
      { type: "tapSquare", square: "g1", now: 2000 },
    );

    expect(swapped).toMatchObject({ placed: { g1: BQ } });
  });

  it("ignores a tap on an empty square with nothing selected", () => {
    const state = rebuilding();

    expect(roundReducer(state, { type: "tapSquare", square: "a1", now: 2000 })).toBe(state);
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
      { type: "tapSquare", square: "g1", now: 2000 },
    );
    const scored = roundReducer(placed, { type: "submit", now: 13500 });

    expect(scored).toMatchObject({
      phase: "scored",
      rebuildMs: 12500,
      score: { accuracy: 50, correct: 1, total: 2, wrong: 1 },
    });
  });

  it("refuses a second white king and a third white rook", () => {
    const WR = { color: "white", type: "rook" } as const;
    const tap = (state: RoundState, square: "a1" | "b1" | "c1") =>
      roundReducer(state, { type: "tapSquare", square, now: 2000 });
    const kings = tap(tap(roundReducer(rebuilding(), { type: "select", piece: WK }), "a1"), "b1");
    const rooks = tap(tap(tap(roundReducer(rebuilding(), { type: "select", piece: WR }), "a1"), "b1"), "c1");

    expect(kings).toMatchObject({ placed: { a1: WK } });
    expect(Object.keys((kings as Extract<RoundState, { phase: "rebuild" }>).placed)).toEqual(["a1"]);
    expect(Object.keys((rooks as Extract<RoundState, { phase: "rebuild" }>).placed)).toEqual(["a1", "b1"]);
  });

  it("lets the last allowed piece replace a different one", () => {
    const withQueen = roundReducer(
      roundReducer(rebuilding(), { type: "select", piece: BQ }),
      { type: "tapSquare", square: "a1", now: 2000 },
    );
    const swapped = roundReducer(
      roundReducer(withQueen, { type: "select", piece: WK }),
      { type: "tapSquare", square: "a1", now: 2000 },
    );

    expect(swapped).toMatchObject({ placed: { a1: WK } });
  });

  it("ignores placement before the board clears", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", target });

    expect(roundReducer(studying, { type: "tapSquare", square: "g1", now: 2000 })).toBe(studying);
  });

  it("logs each placement in the order played and counts every piece lifted, swapped or cleared", () => {
    const steps: RoundAction[] = [
      { type: "select", piece: WK },
      { type: "tapSquare", square: "g1", now: 1400 },
      { type: "select", piece: BQ },
      { type: "tapSquare", square: "d6", now: 2650 },
      { type: "tapSquare", square: "d6", now: 3000 },
      { type: "tapSquare", square: "g1", now: 3500 },
      { type: "select", piece: WK },
      { type: "tapSquare", square: "a1", now: 4200 },
      { type: "clear" },
      { type: "tapSquare", square: "g1", now: 5000 },
      { type: "submit", now: 6000 },
    ];

    const scored = steps.reduce(roundReducer, rebuilding());

    expect(scored).toMatchObject({
      phase: "scored",
      log: {
        startedAt: 1000,
        placements: [[400, 62, "K"], [1650, 19, "q"], [2500, 62, "q"], [3200, 56, "K"], [4000, 62, "K"]],
        removals: 4,
      },
    });
  });
});
