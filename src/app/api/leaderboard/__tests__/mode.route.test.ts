/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/leaderboard/route";
import { getLeaderboard, submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { checkSupabaseConnection } from "@/lib/supabase";

jest.mock("@/lib/services/leaderboardService", () => ({
  getDailyResults: jest.fn(),
  getLeaderboard: jest.fn(),
  submitLeaderboardEntry: jest.fn(),
}));
jest.mock("@/lib/supabase", () => ({ checkSupabaseConnection: jest.fn() }));

const ENTRY = {
  player_name: "Dino beta",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
  skill_rating: 1240,
};

let address = 0;
const post = (body: object) =>
  POST(
    new NextRequest("http://localhost/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `203.0.113.${(address += 1)}` },
      body: JSON.stringify(body),
    }),
  );
const get = (query: string) => GET(new NextRequest(`http://localhost/api/leaderboard?${query}`));

const OPEN = process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;

beforeEach(() => {
  jest.mocked(checkSupabaseConnection).mockReset().mockResolvedValue({ connected: true });
  jest.mocked(submitLeaderboardEntry).mockReset().mockResolvedValue({ status: "stored", entry: { id: "x" } } as never);
  jest.mocked(getLeaderboard).mockReset().mockResolvedValue({ data: [] });
});
afterEach(() => {
  if (OPEN === undefined) delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
  else process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = OPEN;
});

describe("the leaderboard API by mode", () => {
  it("refuses a blindfold score and read while the blindfold board is closed, and stores a board score as before", async () => {
    delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;

    expect((await post({ ...ENTRY, mode: "blindfold" })).status).toBe(400);
    expect((await get("difficulty=medium&mode=blindfold")).status).toBe(400);
    expect((await post(ENTRY)).status).toBe(200);
    expect(jest.mocked(submitLeaderboardEntry).mock.calls.map(([entry]) => entry)).toEqual([
      expect.not.objectContaining({ mode: expect.anything() }),
    ]);
  });

  it("files a blindfold score on the blindfold board once open, and never on the daily board", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";

    expect((await post({ ...ENTRY, mode: "blindfold" })).status).toBe(200);
    expect((await post({ ...ENTRY, difficulty: "daily", daily_day: new Date().toISOString().slice(0, 10), mode: "blindfold", country_code: "SG" })).status).toBe(400);
    expect((await get("difficulty=hard&mode=blindfold")).status).toBe(200);

    expect(jest.mocked(submitLeaderboardEntry).mock.calls.map(([entry]) => [entry.difficulty, "mode" in entry ? entry.mode : undefined])).toEqual([["medium", "blindfold"]]);
    expect(jest.mocked(getLeaderboard).mock.calls).toEqual([[{ difficulty: "hard", mode: "blindfold" }]]);
  });

  it("holds a blindfold round to the same study floor as a board round", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";

    const tooShort = await post({ ...ENTRY, mode: "blindfold", memorize_time: 0.599 });
    const atFloor = await post({ ...ENTRY, mode: "blindfold", memorize_time: 0.6 });

    expect([tooShort.status, await tooShort.json(), atFloor.status]).toEqual([400, { error: "A study of 6 pieces takes at least 0.6 seconds" }, 200]);
  });
});
