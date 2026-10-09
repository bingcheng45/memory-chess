import { isEntryId, parseStanding, rankedAboveFilter } from "@/lib/leaderboard/standing";

describe("rankedAboveFilter", () => {
  it("asks for more correct pieces, then fewer wrong, then faster memorize, then faster solve", () => {
    expect(rankedAboveFilter({ correctPieces: 8, totalWrongPieces: 2, memorizeTime: 10.5, solutionTime: 30 })).toBe(
      "correct_pieces.gt.8," +
        "and(correct_pieces.eq.8,total_wrong_pieces.lt.2)," +
        "and(correct_pieces.eq.8,total_wrong_pieces.eq.2,memorize_time.lt.10.5)," +
        "and(correct_pieces.eq.8,total_wrong_pieces.eq.2,memorize_time.eq.10.5,solution_time.lt.30)",
    );
  });

  it("ranks every recorded wrong count above a missing one, and no missing one above it", () => {
    expect(rankedAboveFilter({ correctPieces: 5, totalWrongPieces: null, memorizeTime: 7, solutionTime: 20 })).toBe(
      "correct_pieces.gt.5," +
        "and(correct_pieces.eq.5,total_wrong_pieces.not.is.null)," +
        "and(correct_pieces.eq.5,total_wrong_pieces.is.null,memorize_time.lt.7)," +
        "and(correct_pieces.eq.5,total_wrong_pieces.is.null,memorize_time.eq.7,solution_time.lt.20)",
    );
  });
});

describe("isEntryId", () => {
  it("accepts a uuid and refuses anything a filter could be smuggled through", () => {
    expect(
      ["0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f", "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f,id.neq.x", "12", 12, null].map(isEntryId),
    ).toEqual([true, false, false, false, false]);
  });
});

describe("parseStanding", () => {
  it("reads a world and a country standing", () => {
    expect(parseStanding({ difficulty: "medium", country: null, rank: 14, total: 200 })).toEqual({
      difficulty: "medium",
      country: null,
      rank: 14,
      total: 200,
    });
    expect(parseStanding({ difficulty: "hard", country: "SG", rank: 1, total: 3 })).toEqual({
      difficulty: "hard",
      country: "SG",
      rank: 1,
      total: 3,
    });
  });

  it("refuses a reply that cannot be a rank", () => {
    expect(
      [
        { difficulty: "custom", country: null, rank: 1, total: 2 },
        { difficulty: "easy", country: "XX", rank: 1, total: 2 },
        { difficulty: "easy", country: null, rank: 0, total: 2 },
        { difficulty: "easy", country: null, rank: 3, total: 2 },
        { difficulty: "easy", country: null, rank: 1.5, total: 2 },
        "rank 1",
        null,
      ].map(parseStanding),
    ).toEqual([null, null, null, null, null, null, null]);
  });
});
