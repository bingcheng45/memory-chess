/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/leaderboard/route";
import { submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { checkSupabaseConnection } from "@/lib/supabase";

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

describe("POST /api/leaderboard", () => {
  beforeEach(() => {
    jest.mocked(checkSupabaseConnection).mockReset().mockResolvedValue({ connected: true });
    jest.mocked(submitLeaderboardEntry).mockReset().mockResolvedValue({ id: 1, ...validEntry } as never);
  });

  it("stores a round with at least one correct piece", async () => {
    const response = await post(validEntry);

    expect(response.status).toBe(200);
    expect(submitLeaderboardEntry).toHaveBeenCalledWith(validEntry);
  });

  it("rejects a round with no correct piece, which the board would never show", async () => {
    const response = await post({ ...validEntry, correct_pieces: 0 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid data values" });
    expect(submitLeaderboardEntry).not.toHaveBeenCalled();
  });
});
