/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/leaderboard/route";
import { submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { checkSupabaseConnection } from "@/lib/supabase";
import { WORLD_CODE } from "@/lib/leaderboard/countries";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboard: jest.fn(),
  submitLeaderboardEntry: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn(),
}));

const validEntry = {
  player_name: "Dino beta",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
  skill_rating: 1240,
};

function post(body: object) {
  return POST(
    new NextRequest("http://localhost/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const storedRow = { id: 1, ...validEntry, country_code: WORLD_CODE };

describe("POST /api/leaderboard", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(checkSupabaseConnection).mockReset().mockResolvedValue({ connected: true });
    jest
      .mocked(submitLeaderboardEntry)
      .mockReset()
      .mockResolvedValue({ status: "stored", entry: storedRow } as never);
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  it("stores a round with at least one correct piece", async () => {
    const response = await post(validEntry);

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith({ ...validEntry, country_code: WORLD_CODE });
  });

  it("rejects a round with no correct piece, which the board would never show", async () => {
    const response = await post({ ...validEntry, correct_pieces: 0 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid data values" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("forwards a known country code to the service", async () => {
    const response = await post({ ...validEntry, country_code: "SG" });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "SG" }));
  });

  it("submits the world code when the body carries no country at all", async () => {
    const response = await post(validEntry);

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "ZZ" }));
  });

  it("submits the world code when the body carries an explicit null country", async () => {
    const response = await post({ ...validEntry, country_code: null });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ country_code: "ZZ" }));
  });

  it("rejects a country code that is not a known code", async () => {
    const response = await post({ ...validEntry, country_code: "qq" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid country code" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("tells the player to come back shortly when the store cannot take the score", async () => {
    const cause = { code: "PGRST204", message: "column missing" };
    jest
      .mocked(submitLeaderboardEntry)
      .mockResolvedValue({ status: "unavailable", cause } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "The leaderboard is being updated. Please try again shortly.",
    });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("unavailable"), cause);
  });

  it("logs the underlying cause behind a 500 so the failure is diagnosable", async () => {
    const cause = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "leaderboard_entries_pkey"',
    };
    jest.mocked(submitLeaderboardEntry).mockResolvedValue({ status: "failed", cause } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An unexpected error occurred" });
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("failed"), cause);
  });

  it("answers a service-side validation failure with its own message and a 400", async () => {
    jest.mocked(submitLeaderboardEntry).mockResolvedValue({
      status: "invalid",
      message: "Player name must be between 4 and 16 characters",
    } as never);

    const response = await post(validEntry);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Player name must be between 4 and 16 characters",
    });
  });

  it.each([
    ["negative", -1],
    ["fractional", 12.5],
    ["a string", "1200"],
    ["null", null],
  ])("rejects a skill rating that is %s", async (_case, skill_rating) => {
    const response = await post({ ...validEntry, skill_rating });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid skill rating" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it.each([
    ["the lowest rating", 0, 0],
    ["the highest rating", 5000, 5000],
    ["a rating above the highest as the highest", 7300, 5000],
  ])("stores %s", async (_case, sent, stored) => {
    const response = await post({ ...validEntry, skill_rating: sent });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ skill_rating: stored }));
  });

  it("stores the starting rating for a tab that sends none", async () => {
    const response = await post({ ...validEntry, skill_rating: undefined });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(expect.objectContaining({ skill_rating: 1000 }));
  });

  it("hands the rating to the insert unchanged", async () => {
    await post(validEntry);

    expect(submitLeaderboardEntry).toHaveBeenCalledWith({
      player_name: "Dino beta",
      difficulty: "medium",
      piece_count: 6,
      correct_pieces: 4,
      memorize_time: 8.25,
      solution_time: 12.5,
      total_wrong_pieces: 2,
      skill_rating: 1240,
      country_code: "ZZ",
    });
  });

  it("stores a daily row with the day its board belongs to", async () => {
    const response = await post({ ...validEntry, difficulty: "daily", daily_day: "2026-10-13" });

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "daily", daily_day: "2026-10-13" }),
    );
  });

  it.each([
    ["no day", { difficulty: "daily" }],
    ["a null day", { difficulty: "daily", daily_day: null }],
    ["a day that does not exist", { difficulty: "daily", daily_day: "2026-02-30" }],
    ["a timestamp instead of a day", { difficulty: "daily", daily_day: "2026-10-13T00:00:00Z" }],
    ["a medium row carrying a day", { difficulty: "medium", daily_day: "2026-10-13" }],
  ])("rejects %s", async (_case, board) => {
    const response = await post({ ...validEntry, ...board });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });

  it("sends no daily day for a board row whose body carries an explicit null", async () => {
    await post({ ...validEntry, daily_day: null });

    expect(jest.mocked(submitLeaderboardEntry).mock.calls[0][0]).not.toHaveProperty("daily_day");
  });

  it("rejects a board that does not exist", async () => {
    const response = await post({ ...validEntry, difficulty: "weekly" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid difficulty or daily day" });
  });
});

