import {
  boardLevel,
  challengeOf,
  isProvisional,
  NEW_PLAYER,
  parseCertainty,
  parseRatedRoundFacts,
  ratingAfter,
  ratingPreview,
  replay,
  STEADY_RD,
  suggestBoard,
  type PlayerRating,
  type RatedRoundFacts,
} from "../rating";

const round = (pieceCount: number, studySeconds: number, accuracy: number, rebuildSeconds = pieceCount * 2.5): RatedRoundFacts => ({
  pieceCount,
  studySeconds,
  rebuildSeconds,
  accuracy,
});

/** A player the game is sure of: rated 1200 at the steady uncertainty. */
const established: PlayerRating = { rating: 1200, rd: STEADY_RD, rounds: 100 };

const RANGES = { pieces: { min: 2, max: 32 }, seconds: { min: 2, max: 60 } };

describe("board level", () => {
  it("puts Medium at 1000 and ranks the presets", () => {
    const levels = [
      [2, 10],
      [6, 10],
      [12, 8],
      [20, 5],
    ].map(([pieceCount, studySeconds]) => Math.round(boardLevel({ pieceCount, studySeconds })));
    expect(levels).toEqual([128, 1000, 1598, 2105]);
  });

  it("counts study time used under a second as one second", () => {
    expect(boardLevel({ pieceCount: 32, studySeconds: 0.01 })).toBe(boardLevel({ pieceCount: 32, studySeconds: 1 }));
  });
});

describe("challenge", () => {
  it("keeps rising past the full board as the rebuild gets faster, down to a quarter second a piece, and only for a round that scored", () => {
    const fullBoard = (accuracy: number, rebuildSeconds: number) => Math.round(challengeOf(round(32, 1, accuracy, rebuildSeconds)));
    expect([fullBoard(100, 80), fullBoard(100, 16), fullBoard(100, 1), fullBoard(40, 1)]).toEqual([2827, 2966, 3026, 2827]);
  });
});

describe("an established player's round", () => {
  const changes = (pieces: number, study: number) =>
    [100, 95, 80, 50, 0].map((accuracy) => ratingAfter(established, round(pieces, study, accuracy)).change);

  it("gains more on harder boards and loses more on easier ones, for a 1200 player", () => {
    expect([changes(2, 10), changes(6, 10), changes(7, 10), changes(12, 8), changes(20, 5)]).toEqual([
      [0, -1, -4, -11, -22],
      [4, 3, -1, -7, -18],
      [6, 5, 1, -6, -19],
      [26, 24, 17, 5, -15],
      [50, 50, 45, 26, -6],
    ]);
  });

  it("reports the round's challenge, expected accuracy and score", () => {
    expect(ratingAfter(established, round(6, 10, 80))).toMatchObject({
      phase: "rated",
      rating: 1199,
      change: -1,
      breakdown: { challenge: 1000, score: 0.8 },
    });
  });

  it("never gains on a board 500 or more below the rating", () => {
    expect(ratingAfter({ ...established, rating: 1600 }, round(6, 10, 100)).change).toBe(0);
  });

  it("never takes the rating below 0", () => {
    expect(ratingAfter({ ...established, rating: 5 }, round(2, 10, 0)).rating).toBe(0);
  });
});

describe("a new player", () => {
  it("starts at 1000, provisional, and moves far on the first round", () => {
    expect(ratingAfter(NEW_PLAYER, round(6, 10, 100))).toEqual({
      phase: "provisional",
      rating: 1192,
      change: 192,
      player: { rating: 1192, rd: expect.closeTo(255.64, 2), rounds: 1 },
      breakdown: { challenge: 1000, expected: expect.closeTo(0.7, 6), score: 1 },
    });
  });

  it("is no longer provisional once the rounds have taught the game their level", () => {
    const after = (n: number) => replay(NEW_PLAYER, Array.from({ length: n }, () => round(6, 10, 70)));
    expect([1, 5, 10, 20].map((n) => isProvisional(after(n)))).toEqual([true, true, true, false]);
  });

  it("never gains on an empty or near-empty board however hard it was", () => {
    expect([0, 20, 40].map((accuracy) => ratingAfter(NEW_PLAYER, round(32, 1, accuracy, 0.2)).change)).toEqual([-20, 0, 0]);
  });

  it("never lowers the rating for a perfect round, and gains nothing from a board 500 or more below it", () => {
    expect([ratingAfter(NEW_PLAYER, round(2, 10, 100)).change, ratingAfter(NEW_PLAYER, round(3, 10, 100)).change, ratingAfter(NEW_PLAYER, round(4, 10, 100)).change]).toEqual([0, 0, 102]);
  });

  it("weighs pieces over study time over rebuild time", () => {
    const after = (r: RatedRoundFacts) => ratingAfter(NEW_PLAYER, r).rating;
    expect([after(round(12, 10, 90)), after(round(6, 5, 90)), after(round(6, 10, 90, 7.5)), after(round(6, 10, 90))]).toEqual([
      1400, 1190, 1152, 1128,
    ]);
  });
});

describe("suggested board", () => {
  it("aims at an even board while provisional and at 75% once established", () => {
    expect([
      suggestBoard(NEW_PLAYER, RANGES),
      suggestBoard(established, RANGES),
      suggestBoard({ ...established, rating: 300 }, RANGES),
      suggestBoard({ ...established, rating: 3200 }, RANGES),
    ]).toEqual([
      { pieceCount: 8, studySeconds: 10 },
      { pieceCount: 7, studySeconds: 10 },
      { pieceCount: 2, studySeconds: 6 },
      { pieceCount: 32, studySeconds: 2 },
    ]);
  });
});

describe("setup-card preview", () => {
  it("gives the board's rating, the expected accuracy and the round's range", () => {
    expect([
      ratingPreview(NEW_PLAYER, [], { pieceCount: 6, studySeconds: 10 }),
      ratingPreview(established, [], { pieceCount: 12, studySeconds: 8 }),
      ratingPreview(established, [], { pieceCount: 2, studySeconds: 10 }),
    ]).toEqual([
      { phase: "provisional", difficultyRating: 1000, expectedAccuracy: 70, perfectGain: 192, maxLoss: -400 },
      { phase: "rated", difficultyRating: 1598, expectedAccuracy: 37, perfectGain: 26, maxLoss: -15 },
      { phase: "rated", difficultyRating: 128, expectedAccuracy: 99, perfectGain: 0, maxLoss: -22 },
    ]);
  });

  it("reads the perfect gain at the player's fastest recent rebuild pace", () => {
    const fast = [round(6, 10, 90, 3)];
    expect(ratingPreview({ ...established, rating: 1000 }, fast, { pieceCount: 6, studySeconds: 10 }).perfectGain).toBe(9);
  });
});

describe("stored facts", () => {
  it("reads whole round facts and drops missing or out-of-range ones", () => {
    expect([
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }),
      parseRatedRoundFacts(undefined),
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, accuracy: 83 }),
      parseRatedRoundFacts({ pieceCount: 6.5, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }),
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 140 }),
    ]).toEqual([{ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }, null, null, null, null]);
  });

  it("reads a stored uncertainty and treats anything out of range as a new player's", () => {
    expect([parseCertainty({ rd: 80, rounds: 12 }), parseCertainty({ rd: 900, rounds: 12 }), parseCertainty({ rd: 80, rounds: 1.5 }), parseCertainty(null)]).toEqual([
      { rd: 80, rounds: 12 },
      { rd: 350, rounds: 0 },
      { rd: 350, rounds: 0 },
      { rd: 350, rounds: 0 },
    ]);
  });
});
