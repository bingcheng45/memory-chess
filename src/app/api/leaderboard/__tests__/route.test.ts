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
});
