import { newReaderRound, readerRoundOf } from "../readerRound";

const saved = (skillRating: unknown, certainty: unknown) => JSON.stringify({ state: { gameState: { skillRating }, certainty }, version: 3 });

describe("readerRoundOf", () => {
  it("offers a 4-piece, 10-second round to a reader who never played", () => {
    expect(readerRoundOf(null)).toEqual({ pieceCount: 4, memorizeTime: 10 });
  });

  it("offers the page's own round to an unrated reader and sizes a rated reader's round from the rating", () => {
    expect(readerRoundOf(null, { pieceCount: 6, memorizeTime: 10 })).toEqual({ pieceCount: 6, memorizeTime: 10 });
    expect(readerRoundOf(saved(1300, { rd: 60, rounds: 40 }), { pieceCount: 6, memorizeTime: 10 })).toEqual({ pieceCount: 8, memorizeTime: 10 });
  });

  it("offers the beginner round while the saved game has no rated round", () => {
    expect(readerRoundOf(saved(1000, { rd: 350, rounds: 0 }))).toEqual({ pieceCount: 4, memorizeTime: 10 });
  });

  it("offers the beginner round when the saved game is not readable", () => {
    expect(readerRoundOf("{not json")).toEqual({ pieceCount: 4, memorizeTime: 10 });
    expect(readerRoundOf(saved("high", { rd: 60, rounds: 40 }))).toEqual({ pieceCount: 4, memorizeTime: 10 });
  });

  it("sizes the round to an established rating", () => {
    expect(readerRoundOf(saved(1000, { rd: 60, rounds: 40 }))).toEqual({ pieceCount: 5, memorizeTime: 10 });
    expect(readerRoundOf(saved(1300, { rd: 60, rounds: 40 }))).toEqual({ pieceCount: 8, memorizeTime: 10 });
    expect(readerRoundOf(saved(1800, { rd: 60, rounds: 40 }))).toEqual({ pieceCount: 15, memorizeTime: 10 });
  });

  it("stretches a provisional rating toward an even board, as the setup card suggests", () => {
    expect(readerRoundOf(saved(1000, { rd: 300, rounds: 2 }))).toEqual({ pieceCount: 8, memorizeTime: 10 });
  });
});

describe("newReaderRound", () => {
  it("keeps a page's round up to 6 pieces with 10 seconds or more to look", () => {
    expect(newReaderRound({ pieceCount: 4, memorizeTime: 12 })).toEqual({ pieceCount: 4, memorizeTime: 12 });
    expect(newReaderRound({ pieceCount: 6, memorizeTime: 10 })).toEqual({ pieceCount: 6, memorizeTime: 10 });
    expect(newReaderRound({ pieceCount: 6, memorizeTime: 20 })).toEqual({ pieceCount: 6, memorizeTime: 20 });
  });

  it("swaps a harder page round for the 4-piece, 10-second beginner round", () => {
    expect(newReaderRound({ pieceCount: 12, memorizeTime: 8 })).toEqual({ pieceCount: 4, memorizeTime: 10 });
    expect(newReaderRound({ pieceCount: 8, memorizeTime: 10 })).toEqual({ pieceCount: 4, memorizeTime: 10 });
    expect(newReaderRound({ pieceCount: 6, memorizeTime: 8 })).toEqual({ pieceCount: 4, memorizeTime: 10 });
  });
});
