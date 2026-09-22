import {
  RANKING_ORDER,
  type RankingScore,
  compareRanking,
  parseCutoffs,
  qualifies,
} from "@/lib/leaderboard/ranking";

const BASELINE: RankingScore = {
  correctPieces: 2,
  totalWrongPieces: 1,
  memorizeTime: 4,
  solutionTime: 6,
};

const PRODUCTION_EASY_WORST: RankingScore = {
  correctPieces: 2,
  totalWrongPieces: 0,
  memorizeTime: 3.917,
  solutionTime: 5.567,
};

function score(overrides: Partial<RankingScore> = {}): RankingScore {
  return { ...BASELINE, ...overrides };
}

const comparisonCases: ReadonlyArray<[string, RankingScore, RankingScore]> = [
  [
    "more correct pieces outranks every later key",
    score({ correctPieces: 3, totalWrongPieces: 5, memorizeTime: 99, solutionTime: 99 }),
    score({ correctPieces: 2 }),
  ],
  [
    "fewer wrong pieces outranks the times",
    score({ totalWrongPieces: 0, memorizeTime: 99, solutionTime: 99 }),
    score({ totalWrongPieces: 1 }),
  ],
  [
    "a shorter memorize time outranks the solution time",
    score({ memorizeTime: 3, solutionTime: 99 }),
    score({ memorizeTime: 4 }),
  ],
  [
    "a shorter solution time breaks the last tie",
    score({ solutionTime: 5 }),
    score({ solutionTime: 6 }),
  ],
  [
    "a recorded wrong-piece count outranks a null one",
    score({ totalWrongPieces: 9 }),
    score({ totalWrongPieces: null }),
  ],
];

describe("RANKING_ORDER", () => {
  it("names the database column, direction and nulls handling for every ranking key", () => {
    expect(RANKING_ORDER).toEqual([
      { field: "correctPieces", column: "correct_pieces", ascending: false },
      {
        field: "totalWrongPieces",
        column: "total_wrong_pieces",
        ascending: true,
        nullsFirst: false,
      },
      { field: "memorizeTime", column: "memorize_time", ascending: true },
      { field: "solutionTime", column: "solution_time", ascending: true },
    ]);
  });
});

describe("compareRanking", () => {
  it.each(comparisonCases)("%s", (_name, better, worse) => {
    expect(compareRanking(better, worse)).toBeLessThan(0);
    expect(compareRanking(worse, better)).toBeGreaterThan(0);
  });

  it("returns 0 for identical scores", () => {
    expect(compareRanking(score(), score())).toBe(0);
  });

  it("returns 0 when both scores have a null wrong-piece count", () => {
    expect(compareRanking(score({ totalWrongPieces: null }), score({ totalWrongPieces: null }))).toBe(0);
  });
});

describe("qualifies", () => {
  it("accepts any score while the board is open", () => {
    const awful = score({ correctPieces: 0, totalWrongPieces: 99, memorizeTime: 999, solutionTime: 999 });

    expect(qualifies(awful, { kind: "open" })).toBe(true);
  });

  it("accepts a score faster than the worst entry on a full board", () => {
    const contender = score({ correctPieces: 2, totalWrongPieces: 0, memorizeTime: 3.0, solutionTime: 5.0 });

    expect(qualifies(contender, { kind: "full", worst: PRODUCTION_EASY_WORST })).toBe(true);
  });

  it("rejects a score slower than the worst entry on a full board", () => {
    const contender = score({ correctPieces: 2, totalWrongPieces: 0, memorizeTime: 10.5, solutionTime: 5.0 });

    expect(qualifies(contender, { kind: "full", worst: PRODUCTION_EASY_WORST })).toBe(false);
  });

  it("rejects a score that exactly ties the worst entry", () => {
    expect(qualifies({ ...PRODUCTION_EASY_WORST }, { kind: "full", worst: PRODUCTION_EASY_WORST })).toBe(
      false,
    );
  });
});

const validPayload = {
  easy: { kind: "full", worst: PRODUCTION_EASY_WORST },
  medium: { kind: "full", worst: { ...BASELINE, totalWrongPieces: null } },
  hard: { kind: "open" },
  grandmaster: { kind: "open" },
};

function withEasy(easy: unknown) {
  return { ...validPayload, easy };
}

describe("parseCutoffs", () => {
  it("accepts a payload carrying all four difficulties", () => {
    expect(parseCutoffs(validPayload)).toEqual(validPayload);
  });

  it("drops unknown fields instead of passing them through", () => {
    const parsed = parseCutoffs({
      ...validPayload,
      version: 3,
      easy: { kind: "full", worst: { ...PRODUCTION_EASY_WORST, streak: 7 } },
    });

    expect(parsed).toEqual(validPayload);
  });

  it.each([
    ["null", null],
    ["a string", "cutoffs"],
    ["an array", [{ kind: "open" }]],
    [
      "a payload missing one difficulty",
      { easy: { kind: "open" }, medium: { kind: "open" }, hard: { kind: "open" } },
    ],
    ["an entry with an unknown kind", withEasy({ kind: "closed" })],
    ["a full entry with no worst", withEasy({ kind: "full" })],
    [
      "a worst with a string where a number belongs",
      withEasy({ kind: "full", worst: { ...PRODUCTION_EASY_WORST, memorizeTime: "3.917" } }),
    ],
    [
      "a worst with NaN",
      withEasy({ kind: "full", worst: { ...PRODUCTION_EASY_WORST, solutionTime: Number.NaN } }),
    ],
    [
      "a worst whose totalWrongPieces is undefined rather than null",
      withEasy({ kind: "full", worst: { ...PRODUCTION_EASY_WORST, totalWrongPieces: undefined } }),
    ],
  ])("rejects %s", (_name, value) => {
    expect(parseCutoffs(value)).toBeNull();
  });
});
