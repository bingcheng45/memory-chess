/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/leaderboard/route";

const requests: string[] = [];
let inFlight = 0;
let mostInFlight = 0;

/** A function declaration so the hoisted jest.mock factory can reach it before this file's consts initialise. */
async function mockFetch(input: RequestInfo | URL): Promise<Response> {
  requests.push(new URL(String(input)).search);
  inFlight += 1;
  mostInFlight = Math.max(mostInFlight, inFlight);
  await new Promise((resolve) => setTimeout(resolve, 5));
  inFlight -= 1;
  return new Response("[]", { status: 200, headers: { "Content-Type": "application/json", "Content-Range": "0-0/0" } });
}

jest.mock("@/lib/supabase", () => {
  const client = jest
    .requireActual("@supabase/supabase-js")
    .createClient("http://127.0.0.1:1", "test-anon-key", { global: { fetch: mockFetch } });
  return {
    supabase: client,
    // As production does it: a request of its own, so a check costs a round trip.
    checkSupabaseConnection: async () => {
      const { error } = await client.from("leaderboard_entries").select("count", { count: "exact", head: true });
      return error ? { connected: false, error: error.message } : { connected: true };
    },
  };
});

beforeEach(() => {
  requests.length = 0;
  mostInFlight = 0;
});

const get = (query: string) => GET(new NextRequest(`http://localhost/api/leaderboard?${query}`));

describe("reading a board, each database request a round trip to another region", () => {
  it("reads a ranked board in one request", async () => {
    const response = await get("difficulty=medium");

    expect(response.status).toBe(200);
    expect(requests).toHaveLength(1);
  });

  it("reads the daily board in two requests sent together, the rows and the results", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T00:30:00Z"));

    const response = await get("difficulty=daily&daily_day=2026-10-13");
    jest.mocked(Date.now).mockRestore();

    expect(await response.json()).toEqual({ data: [], playedLike: null });
    expect([requests.length, mostInFlight]).toEqual([2, 2]);
  });
});
