import {
  CALIBRATION_RULES,
} from "@/lib/home/calibration";
import {
  remainingOf,
  roundReducer,
  scoreReading,
  scoredSquare,
  squareVerdict,
  type LabPosition,
  type RoundAction,
  type RoundConfig,
  type RoundState,
} from "@/lib/round/round";


const WK = { color: "white", type: "king" } as const;
const BQ = { color: "black", type: "queen" } as const;
const WN = { color: "white", type: "knight" } as const;
const BP = { color: "black", type: "pawn" } as const;

const CONFIG: RoundConfig = { ...CALIBRATION_RULES, source: "calibration" };

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

describe("scoredSquare", () => {
  const target: LabPosition = { g1: WK, f3: WN, d8: BQ };
  const placed: LabPosition = { g1: WK, e3: WN, f3: BP };
  const squares = ["g1", "e3", "f3", "d8", "a1"] as const;
  const board = (lens: "overlay" | "placed" | "target") =>
    Object.fromEntries(squares.map((square) => [square, scoredSquare(lens, target, placed, square)]));

  it("shows the player's pieces marked correct or wrong, a wrong piece over a target square included", () => {
    expect(board("placed")).toEqual({
      g1: { piece: WK, mark: "ok" },
      e3: { piece: WN, mark: "wrong" },
      f3: { piece: BP, mark: "wrong" },
      d8: { piece: undefined, mark: undefined },
      a1: { piece: undefined, mark: undefined },
    });
  });

  it("shows the position's pieces marked correct or missed", () => {
    expect(board("target")).toEqual({
      g1: { piece: WK, mark: "ok" },
      e3: { piece: undefined, mark: undefined },
      f3: { piece: WN, mark: "miss" },
      d8: { piece: BQ, mark: "miss" },
      a1: { piece: undefined, mark: undefined },
    });
  });

  it("overlays both on one board, with a ghost for a missed piece and the answer beside a wrong one", () => {
    expect(board("overlay")).toEqual({
      g1: { piece: WK, ghost: undefined, answer: undefined, mark: "ok" },
      e3: { piece: WN, ghost: undefined, answer: undefined, mark: "wrong" },
      f3: { piece: BP, ghost: undefined, answer: WN, mark: "wrong miss" },
      d8: { piece: undefined, ghost: BQ, answer: undefined, mark: "miss" },
      a1: { piece: undefined, ghost: undefined, answer: undefined, mark: undefined },
    });
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

describe("roundReducer", () => {
  const target: LabPosition = { g1: WK, d6: BQ };

  function rebuilding(): RoundState {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 0 });
    return roundReducer(studying, { type: "studyEnded", now: 1000 });
  }

  it("clears the board when the study window ends", () => {
    expect(rebuilding()).toEqual({
      phase: "rebuild",
      config: CONFIG,
      target,
      placed: {},
      selected: null,
      refused: null,
      studyMs: 1000,
      log: { startedAt: 1000, placements: [], removals: 0 },
    });
  });

  it("keeps the real study time when the player ends study early", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 500 });
    expect(roundReducer(studying, { type: "studyEnded", now: 3873 })).toMatchObject({
      phase: "rebuild",
      config: CONFIG,
      studyMs: 3373,
      log: { startedAt: 3873 },
    });
  });

  it("caps the study time at the window when the timer fires a few milliseconds late", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 0 });
    expect(roundReducer(studying, { type: "studyEnded", now: CALIBRATION_RULES.studyMs + 7 })).toMatchObject({
      studyMs: CALIBRATION_RULES.studyMs,
    });
  });

  it("carries the study time into the scored round", () => {
    expect(roundReducer(rebuilding(), { type: "submit", now: 2000 })).toMatchObject({ phase: "scored", studyMs: 1000 });
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
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 0 });

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

describe("the palette inventory", () => {
  const target: LabPosition = { g1: WK, d6: BQ };
  type Rebuild = Extract<RoundState, { phase: "rebuild" }>;

  function rebuilding(): Rebuild {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 0 });
    return roundReducer(studying, { type: "studyEnded", now: 1000 }) as Rebuild;
  }

  function play(state: RoundState, ...actions: RoundAction[]): Rebuild {
    return actions.reduce(roundReducer, state) as Rebuild;
  }

  it("counts what is left of each piece from the position", () => {
    const position: LabPosition = { a1: WN, b1: WN, c1: BP, d1: WK };

    expect(remainingOf(position, WN)).toBe(0);
    expect(remainingOf(position, BP)).toBe(7);
    expect(remainingOf(position, WK)).toBe(0);
    expect(remainingOf(position, BQ)).toBe(1);
  });

  it("names the used-up piece when a third white knight is tapped onto the board", () => {
    const state = play(
      rebuilding(),
      { type: "select", piece: WN },
      { type: "tapSquare", square: "b1", now: 2000 },
      { type: "tapSquare", square: "g1", now: 2100 },
      { type: "tapSquare", square: "e4", now: 2200 },
    );

    expect(state.placed).toEqual({ b1: WN, g1: WN });
    expect(state.selected).toEqual(WN);
    expect(state.refused).toEqual({ piece: WN, attempt: 1 });
  });

  it("counts repeated refusals and forgets them on the next thing that works", () => {
    const full = play(rebuilding(), { type: "select", piece: WK }, { type: "tapSquare", square: "e1", now: 2000 });
    const twice = play(full, { type: "tapSquare", square: "e2", now: 2100 }, { type: "tapSquare", square: "e3", now: 2200 });
    const lifted = play(twice, { type: "tapSquare", square: "e1", now: 2300 });

    expect(twice.refused).toEqual({ piece: WK, attempt: 2 });
    expect(lifted).toMatchObject({ placed: {}, refused: null });
  });

  it("selects a piece that has run out but says so, and lets it lift its copy to move it", () => {
    const picked = play(
      rebuilding(),
      { type: "select", piece: WK },
      { type: "tapSquare", square: "e1", now: 2000 },
      { type: "select", piece: BQ },
      { type: "select", piece: WK },
    );
    const moved = play(picked, { type: "tapSquare", square: "e1", now: 2100 }, { type: "tapSquare", square: "g1", now: 2200 });

    expect(picked).toMatchObject({ selected: WK, refused: { piece: WK, attempt: 1 } });
    expect(moved).toMatchObject({ placed: { g1: WK }, selected: WK, refused: null });
  });

  it("still lets the player put down a used-up piece they are holding", () => {
    const state = play(
      rebuilding(),
      { type: "select", piece: WK },
      { type: "tapSquare", square: "e1", now: 2000 },
      { type: "select", piece: WK },
    );

    expect(state).toMatchObject({ selected: null, refused: null });
  });

  it("refuses a used-up piece grabbed from the palette, and not one that is left", () => {
    const full = play(rebuilding(), { type: "place", piece: WK, square: "e1", now: 2000 });

    expect(play(full, { type: "grab", piece: WK }).refused).toEqual({ piece: WK, attempt: 1 });
    expect(play(full, { type: "grab", piece: WK }, { type: "grab", piece: BQ }).refused).toBeNull();
  });

  it("keeps the same round when a grab has no refusal to clear, so nothing re-renders as a drag starts", () => {
    const state = play(rebuilding(), { type: "place", piece: WK, square: "e1", now: 2000 });

    expect(roundReducer(state, { type: "grab", piece: BQ })).toBe(state);
  });

  it("drops a palette piece on a square without touching the selection, and logs it", () => {
    const state = play(rebuilding(), { type: "select", piece: BQ }, { type: "place", piece: WN, square: "f3", now: 2500 });

    expect(state).toMatchObject({
      placed: { f3: WN },
      selected: BQ,
      log: { placements: [[1500, 45, "N"]], removals: 0 },
    });
  });

  it("replaces a different piece when one is dropped on it, as a tap does", () => {
    const state = play(
      rebuilding(),
      { type: "place", piece: BQ, square: "d6", now: 2000 },
      { type: "place", piece: WN, square: "d6", now: 3000 },
    );

    expect(state).toMatchObject({ placed: { d6: WN }, log: { removals: 1 } });
  });

  it("leaves the board alone when a piece is dropped on its own kind", () => {
    const once = play(rebuilding(), { type: "place", piece: WN, square: "f3", now: 2000 });

    expect(play(once, { type: "place", piece: WN, square: "f3", now: 3000 })).toBe(once);
  });

  it("refuses a dropped piece that has run out, even onto a different piece", () => {
    const state = play(
      rebuilding(),
      { type: "place", piece: WK, square: "e1", now: 2000 },
      { type: "place", piece: BQ, square: "d1", now: 2100 },
      { type: "place", piece: WK, square: "d1", now: 2200 },
    );

    expect(state.placed).toEqual({ e1: WK, d1: BQ });
    expect(state.refused).toEqual({ piece: WK, attempt: 1 });
  });

  it("moves a placed piece to an empty square, logged as a lift and a placement", () => {
    const state = play(
      rebuilding(),
      { type: "place", piece: WN, square: "f3", now: 2000 },
      { type: "move", from: "f3", to: "e5", now: 2600 },
    );

    expect(state).toMatchObject({
      placed: { e5: WN },
      log: { placements: [[1000, 45, "N"], [1600, 28, "N"]], removals: 1 },
    });
  });

  it("moves a piece onto another and sends the one it lands on back to the palette", () => {
    const state = play(
      rebuilding(),
      { type: "place", piece: WN, square: "f3", now: 2000 },
      { type: "place", piece: BQ, square: "d6", now: 2100 },
      { type: "move", from: "f3", to: "d6", now: 2600 },
    );

    expect(state).toMatchObject({ placed: { d6: WN }, log: { removals: 2 } });
    expect(remainingOf(state.placed, BQ)).toBe(1);
  });

  it("ignores a move onto the same square or from an empty one", () => {
    const placed = play(rebuilding(), { type: "place", piece: WN, square: "f3", now: 2000 });

    expect(play(placed, { type: "move", from: "f3", to: "f3", now: 2600 })).toBe(placed);
    expect(play(placed, { type: "move", from: "a1", to: "b1", now: 2600 })).toBe(placed);
  });

  it("removes a piece dragged off the board and counts the removal", () => {
    const state = play(
      rebuilding(),
      { type: "place", piece: WN, square: "f3", now: 2000 },
      { type: "remove", square: "f3" },
    );

    expect(state).toMatchObject({ placed: {}, log: { removals: 1 } });
  });

  it("ignores drags outside the rebuild", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target, now: 0 });

    expect(roundReducer(studying, { type: "place", piece: WN, square: "f3", now: 10 })).toBe(studying);
    expect(roundReducer(studying, { type: "remove", square: "g1" })).toBe(studying);
  });
});

describe("a set board's start", () => {
  const DAILY: RoundConfig = {
    pieceCount: 3,
    studyMs: 10_000,
    source: "daily",
    board: { kind: "daily", day: "2026-10-14", fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1" },
  };

  it("waits on Start without the position, counts three seconds, then studies the board from the moment it ends", () => {
    const ready = roundReducer({ phase: "idle" }, { type: "prepare", config: DAILY, fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1" });
    const countdown = roundReducer(ready, { type: "begin", now: 1_000 });
    const study = roundReducer(countdown, { type: "countdownEnded", now: 4_020 });

    expect(ready).toEqual({ phase: "ready", config: DAILY, fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1" });
    expect(countdown).toEqual({ phase: "countdown", config: DAILY, fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", endsAt: 4_000 });
    expect(study).toEqual({
      phase: "study",
      config: DAILY,
      target: { e8: { color: "black", type: "king" }, a1: { color: "white", type: "rook" }, e1: { color: "white", type: "king" } },
      startedAt: 4_020,
    });
  });

  it("ignores Start and the countdown's end out of turn", () => {
    const ready = roundReducer({ phase: "idle" }, { type: "prepare", config: DAILY, fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1" });
    const idle: RoundState = { phase: "idle" };

    expect(roundReducer(idle, { type: "begin", now: 0 })).toBe(idle);
    expect(roundReducer(ready, { type: "countdownEnded", now: 0 })).toBe(ready);
    expect(roundReducer(ready, { type: "studyEnded", now: 0 })).toBe(ready);
    expect(roundReducer(ready, { type: "select", piece: WK })).toBe(ready);
  });
});

describe("a first round's start", () => {
  const FIRST: RoundConfig = { pieceCount: 2, studyMs: 10_000, source: "home_quick" };

  it("holds a random board behind Start, then counts in and studies the board it was given", () => {
    const ready = roundReducer({ phase: "idle" }, { type: "prepare", config: FIRST, fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" });
    const study = roundReducer(roundReducer(ready, { type: "begin", now: 500 }), { type: "countdownEnded", now: 3_500 });

    expect(ready).toEqual({ phase: "ready", config: FIRST, fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" });
    expect(roundReducer(ready, { type: "studyEnded", now: 20_000 })).toBe(ready);
    expect(study).toEqual({
      phase: "study",
      config: FIRST,
      target: { e8: { color: "black", type: "king" }, e1: { color: "white", type: "king" } },
      startedAt: 3_500,
    });
  });
});

describe("a replay's count-in", () => {
  const REPLAY: RoundConfig = { pieceCount: 2, studyMs: 10_000, source: "try_again" };
  const FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
  const countIn = (now: number): RoundAction => ({ type: "countIn", config: REPLAY, fen: FEN, now });

  it("counts three seconds over the veil without the position, then studies the board it was given from the moment it ends", () => {
    const countdown = roundReducer({ phase: "idle" }, countIn(1_000));
    const study = roundReducer(countdown, { type: "countdownEnded", now: 4_020 });

    expect(countdown).toEqual({ phase: "countdown", config: REPLAY, fen: FEN, endsAt: 4_000 });
    expect(study).toEqual({
      phase: "study",
      config: { pieceCount: 2, studyMs: 10_000, source: "try_again" },
      target: { e8: { color: "black", type: "king" }, e1: { color: "white", type: "king" } },
      startedAt: 4_020,
    });
  });

  it("counts in again from any phase, a running count-in included", () => {
    const studying = roundReducer({ phase: "idle" }, { type: "start", config: CONFIG, target: { e1: WK }, now: 0 });
    const counting = roundReducer(studying, countIn(500));

    expect(roundReducer(counting, countIn(2_000))).toEqual({ phase: "countdown", config: REPLAY, fen: FEN, endsAt: 5_000 });
    expect(counting).toEqual({ phase: "countdown", config: REPLAY, fen: FEN, endsAt: 3_500 });
  });

  it("ignores the study deadline and the board during the count-in", () => {
    const counting = roundReducer({ phase: "idle" }, countIn(0));

    expect(roundReducer(counting, { type: "studyEnded", now: 1_000 })).toBe(counting);
    expect(roundReducer(counting, { type: "begin", now: 1_000 })).toBe(counting);
    expect(roundReducer(counting, { type: "place", piece: WK, square: "e1", now: 1_000 })).toBe(counting);
  });
});
