import { boardLevel, challengeOf, parseRatedRoundFacts, ratingAfter, ratingPreview, type RatedRoundFacts } from "../rating";

const round = (pieceCount: number, studySeconds: number, accuracy: number, rebuildSeconds = pieceCount * 2.5): RatedRoundFacts => ({
  pieceCount,
  studySeconds,
  rebuildSeconds,
  accuracy,
});

/** Plays rounds from the start rating, oldest first. */
const play = (rounds: readonly RatedRoundFacts[]) =>
  rounds.reduce(
    ({ rating, history }, next) => ({ rating: ratingAfter(rating, history, next).rating, history: [next, ...history] }),
    { rating: 1000, history: [] as RatedRoundFacts[] },
  );

/** Thirty rated rounds of Medium, newest first, at a mix of 83%, 100% and 67%. */
const mediumNorm: RatedRoundFacts[] = Array.from({ length: 30 }, (_, i) => round(6, 9 + (i % 3) * 0.5, [83, 100, 67][i % 3], 15));

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

describe("placement", () => {
  it("moves the start by a tenth of the round's estimate and names the round", () => {
    expect(ratingAfter(1000, [], round(6, 10, 100))).toEqual({
      phase: "placement",
      rating: 1040,
      change: 40,
      breakdown: { round: 1, of: 10, boardLevel: 1000, challenge: 1000, estimate: 1400 },
    });
  });

  it("stands at the estimate from all ten rounds once placement ends", () => {
    const tenth = play(Array.from({ length: 9 }, () => round(6, 10, 90)));
    expect(ratingAfter(tenth.rating, tenth.history, round(6, 10, 90))).toMatchObject({ phase: "placement", rating: 1280, breakdown: { round: 10 } });
  });

  it("is the tenth round with nine earlier rounds and rated after that", () => {
    expect([ratingAfter(1000, mediumNorm.slice(0, 9), round(6, 10, 100)).phase, ratingAfter(1000, mediumNorm.slice(0, 10), round(6, 10, 100)).phase]).toEqual([
      "placement",
      "rated",
    ]);
  });

  it("lowers the rating for an empty board however hard it was", () => {
    expect([ratingAfter(1000, [], round(32, 1, 0, 0.2)).change, ratingAfter(1000, [], round(6, 10, 0)).change]).toEqual([-20, -40]);
  });

  it("places ten rounds on the hardest board higher the more they scored, with no jump above the floor", () => {
    const placed = (accuracy: number) => play(Array.from({ length: 10 }, () => round(32, 1, accuracy, 8))).rating;
    expect([44, 45, 46, 47].map(placed)).toEqual([1038, 1110, 1190, 1282]);
  });

  it("places the same rounds the same in either order", () => {
    const rounds = [round(32, 1, 100, 8), ...Array.from({ length: 9 }, () => round(32, 1, 0, 8))];
    expect([play(rounds).rating, play([...rounds].reverse()).rating]).toEqual([855, 855]);
  });

  it("never raises the rating for a failed round or lowers it for a perfect one", () => {
    const strong = play(Array.from({ length: 5 }, () => round(20, 5, 85)));
    expect([
      ratingAfter(strong.rating, strong.history, round(6, 10, 0)).change,
      ratingAfter(1000, [], round(2, 10, 100)).change,
      play(Array.from({ length: 10 }, () => round(2, 10, 100))).rating,
    ]).toEqual([-78, 0, 1000]);
  });

  it("weighs pieces over study time over rebuild time", () => {
    const after = (r: RatedRoundFacts) => ratingAfter(1000, [], r).rating;
    expect([after(round(12, 10, 90)), after(round(6, 5, 90)), after(round(6, 10, 90, 7.5)), after(round(6, 10, 90))]).toEqual([
      1083, 1043, 1034, 1028,
    ]);
  });
});

describe("rated rounds against the player's own norm", () => {
  const changeOf = (r: RatedRoundFacts, rating = 1200) => ratingAfter(rating, mediumNorm, r).change;

  it("gains more for a harder win and little for an easier one", () => {
    expect([changeOf(round(10, 10, 100)), changeOf(round(6, 10, 100)), changeOf(round(3, 10, 100))]).toEqual([34, 7, 0]);
  });

  it("loses less for a harder loss and more for an easier one, and a harder loss still costs", () => {
    expect([changeOf(round(10, 10, 20)), changeOf(round(6, 10, 17)), changeOf(round(3, 10, 33))]).toEqual([-4, -27, -50]);
  });

  it("speeds a rating toward the player's recent rounds: an underrated player gains more and loses less, an overrated one the reverse", () => {
    expect([changeOf(round(6, 10, 100), 1000), changeOf(round(6, 10, 17), 1000), changeOf(round(6, 10, 100), 1400), changeOf(round(6, 10, 17), 1400)]).toEqual([
      24, -8, 1, -44,
    ]);
  });

  it("never gains on an empty board however hard it was", () => {
    expect(changeOf(round(32, 1, 0, 0.2))).toBe(-2);
  });

  it("keeps the rating between 0 and 5000", () => {
    expect([ratingAfter(5, mediumNorm, round(2, 10, 0)).rating, ratingAfter(4990, [], round(32, 1, 100)).rating]).toEqual([0, 5000]);
  });
});

describe("setup-card preview", () => {
  it("gives the board's rating and the round's range during placement and after it", () => {
    expect([
      ratingPreview(1000, [], { pieceCount: 6, studySeconds: 10 }),
      ratingPreview(1600, mediumNorm, { pieceCount: 12, studySeconds: 8 }),
      ratingPreview(1000, mediumNorm, { pieceCount: 2, studySeconds: 10 }),
    ]).toEqual([
      { phase: "placement", difficultyRating: 1000, perfectGain: 40, maxLoss: -40 },
      { phase: "rated", difficultyRating: 1598, perfectGain: 13, maxLoss: -12 },
      { phase: "rated", difficultyRating: 128, perfectGain: 0, maxLoss: -24 },
    ]);
  });
});

describe("stored round facts", () => {
  it("reads whole facts and drops missing or out-of-range ones", () => {
    expect([
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }),
      parseRatedRoundFacts(undefined),
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, accuracy: 83 }),
      parseRatedRoundFacts({ pieceCount: 6.5, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }),
      parseRatedRoundFacts({ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 140 }),
    ]).toEqual([{ pieceCount: 6, studySeconds: 9.5, rebuildSeconds: 12, accuracy: 83 }, null, null, null, null]);
  });
});
