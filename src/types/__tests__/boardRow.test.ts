import { boardRowOf, type LeaderboardEntry } from "@/types/leaderboard";

describe("boardRowOf", () => {
  it("leaves out the fields every row of a board shares and keeps what the table draws", () => {
    const entry: LeaderboardEntry = {
      id: "row-1",
      player_name: "Dino beta",
      country_code: "SG" as LeaderboardEntry["country_code"],
      difficulty: "medium",
      daily_day: null,
      mode: "board",
      piece_count: 6,
      correct_pieces: 6,
      total_wrong_pieces: 0,
      memorize_time: 0.648,
      solution_time: 18.887,
      skill_rating: 1000,
      created_at: "2026-08-04T10:00:00Z",
    };

    expect(boardRowOf(entry)).toEqual({
      id: "row-1",
      player_name: "Dino beta",
      country_code: "SG",
      piece_count: 6,
      correct_pieces: 6,
      total_wrong_pieces: 0,
      memorize_time: 0.648,
      solution_time: 18.887,
      skill_rating: 1000,
      created_at: "2026-08-04T10:00:00Z",
    });
  });
});
