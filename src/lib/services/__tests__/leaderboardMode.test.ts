/** @jest-environment node */

import { getLeaderboard, getLeaderboardCutoffs, submitLeaderboardEntry } from "@/lib/services/leaderboardService";
import { parseBoard } from "@/lib/leaderboard/board";
import { WORLD_CODE } from "@/lib/leaderboard/countries";

const requests: { url: URL; method: string; body: unknown }[] = [];
let reply: () => Response = () => new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });

/** A function declaration so the hoisted jest.mock factory can reach it before this file's consts initialise. */
function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  requests.push({ url: new URL(String(input)), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
  return Promise.resolve(reply());
}

jest.mock("@/lib/supabase", () => {
  const client = jest.requireActual("@supabase/supabase-js").createClient("http://127.0.0.1:1", "test-key", { global: { fetch: mockFetch } });
  return { checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }), supabase: client, leaderboardWriter: () => client };
});

const OPEN = process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
const setOpen = (open: boolean) => {
  if (open) process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
  else delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
};
const modeFilters = () => requests.map(({ url }) => url.searchParams.get("mode"));

beforeEach(() => {
  requests.length = 0;
  reply = () => new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
});
afterAll(() => {
  if (OPEN === undefined) delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
  else process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = OPEN;
});

describe("which board a mode names", () => {
  it("has no blindfold board until it opens, and never a blindfold daily board", () => {
    setOpen(false);
    expect(parseBoard("medium", null, "blindfold")).toBeNull();
    expect(parseBoard("medium", null, undefined)).toEqual({ difficulty: "medium" });

    setOpen(true);
    expect(parseBoard("medium", null, "blindfold")).toEqual({ difficulty: "medium", mode: "blindfold" });
    expect(parseBoard("medium", null, "board")).toEqual({ difficulty: "medium" });
    expect(parseBoard("daily", "2026-10-20", "blindfold")).toBeNull();
    expect(parseBoard("medium", null, "touch")).toBeNull();
  });
});

describe("reading a board by mode", () => {
  it("names no mode while the blindfold board is closed, so the read works before the migration", async () => {
    setOpen(false);

    await getLeaderboard({ difficulty: "medium" });
    await getLeaderboardCutoffs();

    expect(modeFilters()).toEqual([null, null, null, null, null]);
  });

  it("reads board-study rows on a board board, blindfold rows on a blindfold board, and the daily board as before", async () => {
    setOpen(true);

    await getLeaderboard({ difficulty: "medium" });
    await getLeaderboard({ difficulty: "medium", mode: "blindfold" });
    await getLeaderboard({ difficulty: "daily", daily_day: "2026-10-20" });

    expect(modeFilters()).toEqual(["eq.board", "eq.blindfold", null]);
  });

  it("keeps blindfold rows out of the board-study cutoffs once open", async () => {
    setOpen(true);

    await getLeaderboardCutoffs();

    expect(modeFilters()).toEqual(["eq.board", "eq.board", "eq.board", "eq.board"]);
  });
});

describe("storing a blindfold score", () => {
  const SCORE = {
    player_name: "Poteto",
    country_code: WORLD_CODE,
    piece_count: 6,
    correct_pieces: 4,
    memorize_time: 8.25,
    solution_time: 12.5,
    total_wrong_pieces: 2,
    skill_rating: 1000,
  } as const;

  it("writes the mode with a blindfold row and none with a board row", async () => {
    reply = () => new Response(JSON.stringify({ id: "x" }), { status: 201, headers: { "Content-Type": "application/json" } });

    await submitLeaderboardEntry({ ...SCORE, difficulty: "medium", mode: "blindfold" });
    await submitLeaderboardEntry({ ...SCORE, difficulty: "medium" });

    expect(requests.map(({ body }) => (body as Record<string, unknown>).mode)).toEqual(["blindfold", undefined]);
  });

  it("is unavailable, never filed on the board-study board, while the column is missing", async () => {
    const warned = jest.spyOn(console, "warn").mockImplementation(() => {});
    reply = () =>
      new Response(JSON.stringify({ code: "PGRST204", details: null, hint: null, message: "Could not find the 'mode' column of 'leaderboard_entries' in the schema cache" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const result = await submitLeaderboardEntry({ ...SCORE, difficulty: "medium", mode: "blindfold" });

    expect(result.status).toBe("unavailable");
    expect(requests).toHaveLength(1);
    warned.mockRestore();
  });
});
