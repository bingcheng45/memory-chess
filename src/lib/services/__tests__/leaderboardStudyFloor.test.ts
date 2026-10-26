/** @jest-environment node */

import { getLeaderboard, getLeaderboardCutoffs, getStanding } from "@/lib/services/leaderboardService";
import { studyFloorSeconds } from "@/lib/leaderboard/studyFloor";
import { WEEKLY_ARC, settingsIn } from "@/lib/daily/schedule";
import { ratingAfter, NEW_PLAYER } from "@/lib/game/rating";
import { SUBMITTABLE_RATING_CEILING } from "@/lib/leaderboard/ratingCeiling";

const requests: URL[] = [];

/** A function declaration so the hoisted jest.mock factory can reach it before this file's consts initialise. */
function mockFetch(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(String(input));
  requests.push(url);
  const body = url.searchParams.has("id") ? (found ?? ENTRY) : [];
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
}
let found: object | null = null;
const ENTRY = { id: "a", difficulty: "medium", daily_day: null, piece_count: 6, correct_pieces: 6, total_wrong_pieces: 0, memorize_time: 3, solution_time: 9, player_name: "Dino beta", created_at: "2026-10-20T00:00:00Z" };

jest.mock("@/lib/supabase", () => {
  const client = jest.requireActual("@supabase/supabase-js").createClient("http://127.0.0.1:1", "test-key", { global: { fetch: mockFetch } });
  return { checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }), supabase: client, leaderboardWriter: () => client };
});

beforeEach(() => {
  requests.length = 0;
  found = null;
});

const floorFilters = () => requests.map((url) => url.searchParams.get("memorize_time"));

describe("the study floor", () => {
  it.each([
    [2, 0.3],
    [6, 0.6],
    [12, 1.2],
    [20, 2],
    [32, 3.2],
  ])("floors a %i-piece study at %f s, exactly as the database column stores it", (pieces, floor) => {
    expect(studyFloorSeconds(pieces)).toBe(floor);
  });

  it("is cleared by every study time a daily board can set, so the database check never refuses a daily row", () => {
    const settings = Object.values(WEEKLY_ARC).flatMap(settingsIn);

    expect(settings.length).toBeGreaterThan(0);
    for (const { pieceCount, memorizeTime } of settings) {
      expect(memorizeTime).toBeGreaterThanOrEqual(studyFloorSeconds(pieceCount));
    }
  });

  it("hides rows under it from each ranked board read", async () => {
    await getLeaderboard({ difficulty: "easy" });
    await getLeaderboard({ difficulty: "medium" });
    await getLeaderboard({ difficulty: "hard" });
    await getLeaderboard({ difficulty: "grandmaster" });

    expect(floorFilters()).toEqual(["gte.0.3", "gte.0.6", "gte.1.2", "gte.2"]);
  });

  it("hides them from a blindfold board too, and from the cutoff each board is held to", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
    try {
      await getLeaderboard({ difficulty: "medium", mode: "blindfold" });
      expect(floorFilters()).toEqual(["gte.0.6"]);
      expect(requests[0].searchParams.get("mode")).toBe("eq.blindfold");

      requests.length = 0;
      await getLeaderboardCutoffs();
      expect(floorFilters().sort()).toEqual(["gte.0.3", "gte.0.6", "gte.1.2", "gte.2"]);
    } finally {
      delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
    }
  });

  it("leaves the daily board unfiltered, since its study time is fixed by the day", async () => {
    await getLeaderboard({ difficulty: "daily", daily_day: "2026-10-20" });

    expect(floorFilters()).toEqual([null]);
  });

  it("counts a player's standing only against rows over the floor", async () => {
    await getStanding("a", "world");

    expect(requests.filter((url) => !url.searchParams.has("id")).map((url) => url.searchParams.get("memorize_time"))).toEqual(["gte.0.6", "gte.0.6"]);
  });
});

describe("a standing lookup by id", () => {
  it.each([
    ["medium", 6, 0.565],
    ["easy", 2, 0.067],
  ])("reports a %s entry of %i pieces studied %f s as missing, as the board hides it, and counts nothing", async (difficulty, piece_count, memorize_time) => {
    found = { ...ENTRY, difficulty, piece_count, memorize_time };

    expect(await getStanding("a", "world")).toEqual({ status: "missing" });
    expect(requests.filter((url) => !url.searchParams.has("id"))).toEqual([]);
  });

  it("still looks up an entry exactly at the floor", async () => {
    found = { ...ENTRY, memorize_time: 0.6 };

    expect((await getStanding("a", "world")).status).not.toBe("missing");
    expect(requests.filter((url) => !url.searchParams.has("id"))).toHaveLength(2);
  });
});

describe("the highest rating a client can send", () => {
  const perfect = (pieceCount: number, studySeconds: number) => ({ pieceCount, studySeconds, rebuildSeconds: pieceCount * 0.25, accuracy: 100 });
  // Custom games are rated too, so the study time is not held to the ranked floor here.
  const BOARDS = [2, 6, 12, 20, 32].flatMap((pieces) => [1, 5, 12, 60].map((seconds) => ({ pieces, seconds })));

  it("is above what perfect, fastest-possible play on any board reaches, including 32 pieces studied for 1 s", () => {
    const peaks = BOARDS.map(({ pieces, seconds }) => {
      let player = NEW_PLAYER;
      let peak = 0;
      for (let round = 0; round < 3000; round += 1) {
        player = ratingAfter(player, perfect(pieces, seconds)).player;
        peak = Math.max(peak, player.rating);
      }
      return peak;
    });

    expect(Math.max(...peaks)).toBeGreaterThan(3300);
    expect(Math.max(...peaks)).toBeLessThan(SUBMITTABLE_RATING_CEILING);
  });

  it("is above what a climb, a long run of uninformative rounds and one dip then three top rounds reaches", () => {
    const top = perfect(32, 1);
    let player = NEW_PLAYER;
    for (let round = 0; round < 300; round += 1) player = ratingAfter(player, top).player;
    for (let round = 0; round < 3000; round += 1) player = ratingAfter(player, { pieceCount: 2, studySeconds: 60, rebuildSeconds: 100, accuracy: 100 }).player;
    const widened = player;

    let peak = 0;
    for (const pieces of [2, 12, 32]) {
      for (const studySeconds of [1, 60]) {
        for (let accuracy = 0; accuracy <= 100; accuracy += 10) {
          let after = ratingAfter(widened, { pieceCount: pieces, studySeconds, rebuildSeconds: 1000, accuracy }).player;
          for (let round = 0; round < 3; round += 1) {
            after = ratingAfter(after, top).player;
            peak = Math.max(peak, after.rating);
          }
        }
      }
    }

    expect(peak).toBeGreaterThan(3400);
    expect(peak).toBeLessThan(SUBMITTABLE_RATING_CEILING);
  });
});
