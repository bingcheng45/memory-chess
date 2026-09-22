/** @jest-environment node */

import { getLeaderboard, getLeaderboardCutoffs } from "@/lib/services/leaderboardService";

const RANKING_ORDER_ON_THE_WIRE =
  "correct_pieces.desc,total_wrong_pieces.asc.nullslast,memorize_time.asc,solution_time.asc";

const mockRequestUrls: string[] = [];

/**
 * A function declaration, not a const: jest hoists the `jest.mock` factory above
 * every import, and the factory builds the client at require time, before any
 * `const` in this file has been initialised.
 */
function mockFetch(input: RequestInfo | URL): Promise<Response> {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  mockRequestUrls.push(url);
  return Promise.resolve(
    new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json", "content-range": "0-0/0" },
    }),
  );
}

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }),
  supabase: jest
    .requireActual("@supabase/supabase-js")
    .createClient("http://127.0.0.1:1", "test-anon-key", { global: { fetch: mockFetch } }),
}));

function paramsOf(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

function requestMatching(fragment: string): URLSearchParams {
  const match = mockRequestUrls.find((url) => url.includes(fragment));
  if (match === undefined) {
    throw new Error(`no captured request matched ${fragment}; captured ${mockRequestUrls.length}`);
  }
  return paramsOf(match);
}

describe("the leaderboard ranking order on the wire", () => {
  beforeEach(() => {
    mockRequestUrls.length = 0;
  });

  it("sends the board's ranking order unchanged when listing a difficulty", async () => {
    const result = await getLeaderboard("hard");

    expect(result.error).toBeUndefined();
    expect(mockRequestUrls).toHaveLength(1);

    const params = paramsOf(mockRequestUrls[0]);
    expect(params.get("order")).toBe(RANKING_ORDER_ON_THE_WIRE);
    expect(params.get("select")).toBe("*");
    expect(params.get("difficulty")).toBe("eq.hard");
    expect(params.get("correct_pieces")).toBe("gt.0");
    expect(params.get("limit")).toBe("200");
  });

  it("sends that same ranking order when reading a board's cutoff", async () => {
    const cutoffs = await getLeaderboardCutoffs();

    expect(cutoffs).not.toBeNull();
    expect(mockRequestUrls).toHaveLength(4);

    const params = requestMatching("difficulty=eq.easy");
    expect(params.get("order")).toBe(RANKING_ORDER_ON_THE_WIRE);
    expect(params.get("select")).toBe(
      "correct_pieces,total_wrong_pieces,memorize_time,solution_time",
    );
    expect(params.get("correct_pieces")).toBe("gt.0");
  });

  it("asks only for the 200th ranked row, which is the score to beat", async () => {
    await getLeaderboardCutoffs();

    const params = requestMatching("difficulty=eq.grandmaster");
    expect(params.get("offset")).toBe("199");
    expect(params.get("limit")).toBe("1");
  });

  it("reads a cutoff for every difficulty the board ranks", async () => {
    await getLeaderboardCutoffs();

    const difficulties = mockRequestUrls.map((url) => paramsOf(url).get("difficulty"));
    expect(difficulties.sort()).toEqual([
      "eq.easy",
      "eq.grandmaster",
      "eq.hard",
      "eq.medium",
    ]);
  });
});
