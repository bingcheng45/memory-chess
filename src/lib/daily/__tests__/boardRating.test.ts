import { boardRatingOf, dailyResultOf, playedLikeOf, type DailyResult, type DailyResultRow } from "../boardRating";

const same = (count: number, rating: number, score: number, pieces = 6): DailyResult[] =>
  Array.from({ length: count }, () => ({ rating, score, pieces }));

const SCORES = [1, 5 / 6, 4 / 6, 3 / 6];
const honest: DailyResult[] = Array.from({ length: 40 }, (_, index) => ({ rating: 800 + 20 * index, score: SCORES[index % 4], pieces: 6 }));

describe("boardRatingOf", () => {
  it("shows nothing below 25 results", () => {
    expect(boardRatingOf(same(24, 1400, 0.7), 1000)).toBeNull();
    expect(boardRatingOf(same(25, 1400, 0.7), 1000)).toBe(1230);
  });

  it("stays at the formula level when everyone scores what that level predicts", () => {
    expect(boardRatingOf(same(30, 1000, 0.7), 1000)).toBe(1000);
  });

  it("moves toward the rating that players scoring 70% hold, held back by the prior", () => {
    expect(boardRatingOf(same(30, 1400, 0.7), 1000)).toBe(1250);
  });

  it("reads a mixed day of players", () => {
    expect(boardRatingOf(honest, 1000)).toBe(1040);
  });

  it("moves a bounded amount when ten rows claim a 2500 rating and score nothing", () => {
    expect(boardRatingOf([...honest, ...same(10, 2500, 0)], 1000)).toBe(1100);
  });

  it("moves a bounded amount when ten rows claim a 600 rating and score everything", () => {
    expect(boardRatingOf([...honest, ...same(10, 600, 1)], 1000)).toBe(850);
  });
});

describe("dailyResultOf", () => {
  it("scores a row as the game scores the round, charging pieces placed beyond the count", () => {
    expect(dailyResultOf({ piece_count: 6, correct_pieces: 5, total_wrong_pieces: 1, skill_rating: 1200 })).toEqual({ rating: 1200, score: 0.83, pieces: 6 });
    expect(dailyResultOf({ piece_count: 6, correct_pieces: 5, total_wrong_pieces: 3, skill_rating: 1200 })).toEqual({ rating: 1200, score: 0.63, pieces: 6 });
  });

  it("leaves out a row without a rating", () => {
    expect(dailyResultOf({ piece_count: 6, correct_pieces: 6, total_wrong_pieces: 0, skill_rating: null })).toBeNull();
    expect(dailyResultOf({ piece_count: 6, correct_pieces: 6, total_wrong_pieces: null, skill_rating: 900 })).toEqual({ rating: 900, score: 1, pieces: 6 });
  });
});

const row = (index: number, skill_rating: number | null = 1400): DailyResultRow =>
  index % 2 ? { piece_count: 6, correct_pieces: 5, total_wrong_pieces: 1, skill_rating } : { piece_count: 6, correct_pieces: 4, total_wrong_pieces: 2, skill_rating };

describe("playedLikeOf", () => {
  const MEDIUM = { pieceCount: 6, memorizeTime: 10 };

  it("reads a day's rows against its setting's formula level", () => {
    expect(playedLikeOf(Array.from({ length: 30 }, (_, index) => row(index)), MEDIUM)).toBe(1180);
  });

  it("counts only rows with a rating toward the 25 it needs", () => {
    const rows = Array.from({ length: 30 }, (_, index) => row(index, index < 24 ? 1400 : null));
    expect(playedLikeOf(rows, MEDIUM)).toBeNull();
    expect(playedLikeOf([...rows, row(30)], MEDIUM)).toBe(1170);
  });
});
