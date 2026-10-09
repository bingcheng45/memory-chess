import { ENTRIES_KEY, entryFromRow, parseEntries, rememberEntry, withEntry, withoutEntry, type StoredEntry } from "@/lib/lab/entries";

const ID_A = "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f";
const ID_B = "7d1f0a2e-5b6c-4d8e-8f9a-0b1c2d3e4f5a";

const row = {
  id: ID_A,
  player_name: "Poteto",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 5,
  total_wrong_pieces: 1,
  memorize_time: 9.25,
  solution_time: 14.5,
  country_code: "SG",
  created_at: "2026-10-09T01:00:00Z",
};

const medium: StoredEntry = {
  id: ID_A,
  difficulty: "medium",
  country: "SG" as StoredEntry["country"],
  score: { correctPieces: 5, totalWrongPieces: 1, memorizeTime: 9.25, solutionTime: 14.5 },
  submittedAt: 1_000,
};

describe("entryFromRow", () => {
  it("keeps the id, difficulty, country and score the leaderboard stored, and when it was sent", () => {
    expect(entryFromRow(row, 1_000)).toEqual(medium);
  });

  it("reads a row stored before countries existed as the world, and refuses a row with no usable id or score", () => {
    expect(entryFromRow({ ...row, country_code: undefined, total_wrong_pieces: null }, 5)).toEqual({
      ...medium,
      country: "ZZ",
      score: { ...medium.score, totalWrongPieces: null },
      submittedAt: 5,
    });
    expect([{ ...row, id: 1 }, { ...row, difficulty: "custom" }, { ...row, correct_pieces: "5" }, null].map((bad) => entryFromRow(bad, 1))).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("withEntry", () => {
  it("keeps the better entry on a difficulty, the newer one on a tie, and each difficulty apart", () => {
    const worse = { ...medium, id: ID_B, score: { ...medium.score, correctPieces: 4 }, submittedAt: 2_000 };
    const tie = { ...medium, id: ID_B, submittedAt: 3_000 };
    const hard = { ...medium, id: ID_B, difficulty: "hard" as const };

    expect(withEntry({ medium }, worse)).toEqual({ medium });
    expect(withEntry({ medium }, tie)).toEqual({ medium: tie });
    expect(withEntry({ medium }, hard)).toEqual({ medium, hard });
    expect(withEntry(null, medium)).toEqual({ medium });
  });
});

describe("withoutEntry", () => {
  it("drops one difficulty, and reads an empty set as nothing stored", () => {
    const hard = { ...medium, id: ID_B, difficulty: "hard" as const };

    expect(withoutEntry({ medium, hard }, "medium")).toEqual({ hard });
    expect(withoutEntry({ medium }, "medium")).toBeNull();
  });
});

describe("parseEntries", () => {
  it("reads what withEntry stored and skips a damaged difficulty instead of dropping the rest", () => {
    const hard = { ...medium, id: ID_B, difficulty: "hard" };
    const text = JSON.stringify({ medium, hard: { ...hard, id: "not an id" }, easy: { ...medium, difficulty: "easy", id: ID_B } });

    expect(parseEntries(JSON.stringify({ medium }))).toEqual({ medium });
    expect(parseEntries(text)).toEqual({ medium, easy: { ...medium, difficulty: "easy", id: ID_B } });
    expect([parseEntries(null), parseEntries("{"), parseEntries("{}"), parseEntries(JSON.stringify({ medium: { ...medium, difficulty: "hard" } }))]).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("rememberEntry", () => {
  beforeEach(() => window.localStorage.clear());

  it("stores the submitted entry beside any kept for other difficulties", () => {
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify({ hard: { ...medium, id: ID_B, difficulty: "hard" } }));

    rememberEntry(row, 1_000);

    expect(JSON.parse(window.localStorage.getItem(ENTRIES_KEY) ?? "null")).toEqual({
      hard: { ...medium, id: ID_B, difficulty: "hard" },
      medium,
    });
  });

  it("stores nothing for a reply it cannot read, and survives storage refusing the write", () => {
    rememberEntry({ success: true }, 1_000);
    const refuse = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => rememberEntry(row, 1_000)).not.toThrow();
    refuse.mockRestore();

    expect(window.localStorage.getItem(ENTRIES_KEY)).toBeNull();
  });
});
