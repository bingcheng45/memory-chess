/** @jest-environment node */

import { getLeaderboard } from "@/lib/services/leaderboardService";

const DATABASE_WORDS = 'relation "public.leaderboard_entries" does not exist';

/** A function declaration so the hoisted jest.mock factory can reach it before this file's consts initialise. */
function mockFetch(): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify({ code: "42P01", details: null, hint: null, message: DATABASE_WORDS }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }),
  supabase: jest
    .requireActual("@supabase/supabase-js")
    .createClient("http://127.0.0.1:1", "test-anon-key", { global: { fetch: mockFetch } }),
}));

describe("reading a board the database cannot serve", () => {
  it("returns a generic message and logs the database's own words", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await getLeaderboard({ difficulty: "medium" });

    expect(result).toEqual({ data: [], error: "The leaderboard is unavailable. Please try again shortly." });
    expect(logged.mock.calls).toEqual([["Supabase query error:", expect.objectContaining({ message: DATABASE_WORDS })]]);
    logged.mockRestore();
  });
});
