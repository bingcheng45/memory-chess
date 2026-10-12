/** @jest-environment node */

import { submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { parseCountryCode } from "@/lib/leaderboard/countries";
import type { LeaderboardSubmission } from "@/types/leaderboard";

const SINGAPORE = parseCountryCode("SG");
if (SINGAPORE === null) throw new Error("SG is not a known country code");

jest.mock("@/lib/supabase", () => {
  const single = jest.fn();
  const insert = jest.fn(() => ({ select: () => ({ single }) }));
  return {
    supabase: { from: () => ({ insert }) },
    checkSupabaseConnection: jest.fn(),
    mockInsert: insert,
    mockSingle: single,
  };
});

const { mockInsert, mockSingle } = jest.requireMock("@/lib/supabase") as {
  mockInsert: jest.Mock;
  mockSingle: jest.Mock;
};

const entry: LeaderboardSubmission = {
  player_name: "Poteto",
  country_code: SINGAPORE,
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
  skill_rating: 1240,
};

const entryWithoutRating = {
  player_name: "Poteto",
  country_code: "SG",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
};

function missingColumn(code: string) {
  return {
    code,
    details: null,
    hint: null,
    message:
      "Could not find the 'skill_rating' column of 'leaderboard_entries' in the schema cache",
  };
}

describe("submitLeaderboardEntry", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    mockInsert.mockClear();
    mockSingle.mockReset();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each(["PGRST204", "42703"])(
    "keeps the score and its country when the rating column is missing (%s)",
    async (code) => {
      mockSingle
        .mockResolvedValueOnce({ data: null, error: missingColumn(code) })
        .mockResolvedValueOnce({ data: { id: "row-1", ...entryWithoutRating }, error: null });

      const result = await submitLeaderboardEntry(entry);

      expect(result).toEqual({ status: "stored", entry: { id: "row-1", ...entryWithoutRating } });
      expect(mockInsert).toHaveBeenNthCalledWith(1, entry);
      expect(mockInsert).toHaveBeenNthCalledWith(2, entryWithoutRating);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(code));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("migration (0004) is outstanding"));
    },
  );

  it("drops the daily day with the rating, so the retry names no column 0004 adds", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: missingColumn("PGRST204") })
      .mockResolvedValueOnce({ data: null, error: { code: "23514", details: null, hint: null, message: "check" } });

    await submitLeaderboardEntry({ ...entry, difficulty: "daily", daily_day: "2026-10-13" });

    expect(mockInsert).toHaveBeenNthCalledWith(2, { ...entryWithoutRating, difficulty: "daily" });
  });

  it("reports the database unavailable when the retry fails too", async () => {
    const error = missingColumn("PGRST204");
    mockSingle
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({ data: null, error });

    const result = await submitLeaderboardEntry(entry);

    expect(result).toEqual({ status: "unavailable", cause: error });
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it("does not retry an insert error that has nothing to do with the column", async () => {
    const error = {
      code: "23505",
      details: null,
      hint: null,
      message: 'duplicate key value violates unique constraint "leaderboard_entries_pkey"',
    };
    mockSingle.mockResolvedValueOnce({ data: null, error });

    const result = await submitLeaderboardEntry(entry);

    expect(result).toEqual({ status: "failed", cause: error });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("rejects a name outside the allowed length before touching the database", async () => {
    const result = await submitLeaderboardEntry({ ...entry, player_name: "Po" });

    expect(result).toEqual({
      status: "invalid",
      message: "Player name must be between 4 and 16 characters",
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
