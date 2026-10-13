import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import type { LeaderboardSubmission } from "@/types/leaderboard";

jest.mock("@/lib/lab/entries", () => {
  throw new Error("Loading chunk 77 failed");
});

const SUBMISSION: LeaderboardSubmission = {
  player_name: "Poteto",
  country_code: "SG",
  difficulty: "daily",
  daily_day: "2026-10-13",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 10,
  solution_time: 12.34,
  total_wrong_pieces: 2,
  skill_rating: 1000,
};

describe("posting a score when the stored-entries code fails to load", () => {
  it("reports the stored score as posted, with no entry to remember", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: { id: "3c3c3c3c-0000-4000-8000-000000000003" } }) });

    await expect(postLeaderboardEntry(SUBMISSION)).resolves.toEqual({ ok: true, entry: null, row: { id: "3c3c3c3c-0000-4000-8000-000000000003" } });
  });

  it("still reports the server's refusal as a failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "Invalid data values" }) });

    await expect(postLeaderboardEntry(SUBMISSION)).resolves.toEqual({ ok: false, message: "Invalid data values" });
  });
});
