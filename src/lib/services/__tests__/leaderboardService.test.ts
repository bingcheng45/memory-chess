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

const without = (...columns: string[]) =>
  Object.fromEntries(Object.entries(entry).filter(([column]) => !columns.includes(column)));
const entryWithoutRating = without("skill_rating");
const entryWithoutRatingOrCountry = without("skill_rating", "country_code");

function missingColumn(code: string, column = "skill_rating") {
  return {
    code,
    details: null,
    hint: null,
    message: `Could not find the '${column}' column of 'leaderboard_entries' in the schema cache`,
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
      expect(mockInsert.mock.calls).toEqual([[entry], [entryWithoutRating]]);
      expect(warn).toHaveBeenCalledWith(
        `Leaderboard insert rejected a column (${code}: Could not find the 'skill_rating' column of 'leaderboard_entries' in the schema cache); the rating and daily migration (0004) is outstanding. Retrying without skill_rating 1240.`,
      );
    },
  );

  it("keeps the score when the country column is missing as well", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: missingColumn("PGRST204") })
      .mockResolvedValueOnce({ data: null, error: missingColumn("PGRST204", "country_code") })
      .mockResolvedValueOnce({ data: { id: "row-1", ...entryWithoutRatingOrCountry }, error: null });

    const result = await submitLeaderboardEntry(entry);

    expect(result).toEqual({ status: "stored", entry: { id: "row-1", ...entryWithoutRatingOrCountry } });
    expect(mockInsert.mock.calls).toEqual([[entry], [entryWithoutRating], [entryWithoutRatingOrCountry]]);
    expect(warn).toHaveBeenLastCalledWith(
      "Leaderboard insert rejected country_code SG (PGRST204: Could not find the 'country_code' column of 'leaderboard_entries' in the schema cache); the country migration is outstanding. Retrying without it.",
    );
  });

  it("does not retry a daily row, which no table without 0004 can hold", async () => {
    const error = missingColumn("PGRST204");
    mockSingle.mockResolvedValueOnce({ data: null, error });

    const result = await submitLeaderboardEntry({ ...entry, difficulty: "daily", daily_day: "2026-10-13" });

    expect(result).toEqual({ status: "unavailable", cause: error });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("reports the database unavailable when the rating retry fails on anything but a column", async () => {
    const error = { code: "23514", details: null, hint: null, message: "check" };
    mockSingle
      .mockResolvedValueOnce({ data: null, error: missingColumn("PGRST204") })
      .mockResolvedValueOnce({ data: null, error });

    const result = await submitLeaderboardEntry(entry);

    expect(result).toEqual({ status: "unavailable", cause: error });
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it("reports the database unavailable when the country retry fails too", async () => {
    const error = missingColumn("PGRST204", "country_code");
    mockSingle
      .mockResolvedValueOnce({ data: null, error: missingColumn("PGRST204") })
      .mockResolvedValueOnce({ data: null, error })
      .mockResolvedValueOnce({ data: null, error });

    const result = await submitLeaderboardEntry(entry);

    expect(result).toEqual({ status: "unavailable", cause: error });
    expect(mockInsert).toHaveBeenCalledTimes(3);
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
