/** @jest-environment node */

import { getStanding } from "@/lib/services/leaderboardService";

const ENTRY_ID = "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f";

interface Board {
  row: Record<string, unknown> | null;
  above: number;
  total: number;
  failOn?: "row" | "count";
}

const mockBoard: Board = { row: null, above: 0, total: 0 };
const mockRequests: URL[] = [];

// PostgREST reports a HEAD count in Content-Range.
function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
  mockRequests.push(url);
  const failure = () => Promise.resolve(new Response(JSON.stringify({ message: "boom", code: "XX000" }), { status: 500 }));
  if (url.searchParams.has("id")) {
    if (mockBoard.failOn === "row") return failure();
    const objectWanted = new Headers(init?.headers).get("Accept")?.includes("vnd.pgrst.object");
    const body = objectWanted ? mockBoard.row : mockBoard.row === null ? [] : [mockBoard.row];
    if (objectWanted && mockBoard.row === null) return Promise.resolve(new Response(JSON.stringify({ code: "PGRST116" }), { status: 406 }));
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
  }
  if (mockBoard.failOn === "count") return failure();
  const count = url.searchParams.has("or") ? mockBoard.above : mockBoard.total;
  return Promise.resolve(new Response(null, { status: 200, headers: { "content-range": `*/${count}` } }));
}

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }),
  supabase: jest
    .requireActual("@supabase/supabase-js")
    .createClient("http://127.0.0.1:1", "test-anon-key", { global: { fetch: mockFetch } }),
}));

const mediumRow = {
  id: ENTRY_ID,
  player_name: "Poteto",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 5,
  total_wrong_pieces: 1,
  memorize_time: 9.25,
  solution_time: 14.5,
  country_code: "SG",
  created_at: "2026-10-09T01:00:00Z",
};

const countRequests = () => mockRequests.filter((url) => !url.searchParams.has("id"));

describe("getStanding", () => {
  beforeEach(() => {
    mockRequests.length = 0;
    Object.assign(mockBoard, { row: mediumRow, above: 13, total: 200, failOn: undefined });
  });

  it("ranks the entry one below the entries strictly above it, among every ranked entry on its difficulty", async () => {
    await expect(getStanding(ENTRY_ID, "world")).resolves.toEqual({
      status: "ranked",
      standing: { difficulty: "medium", country: null, rank: 14, total: 200 },
    });

    const [above, total] = [countRequests().find((url) => url.searchParams.has("or")), countRequests().find((url) => !url.searchParams.has("or"))];
    expect(above?.searchParams.get("or")).toBe(
      "(correct_pieces.gt.5,and(correct_pieces.eq.5,total_wrong_pieces.lt.1),and(correct_pieces.eq.5,total_wrong_pieces.eq.1,memorize_time.lt.9.25),and(correct_pieces.eq.5,total_wrong_pieces.eq.1,memorize_time.eq.9.25,solution_time.lt.14.5))",
    );
    expect([above, total].map((url) => [url?.searchParams.get("difficulty"), url?.searchParams.get("correct_pieces"), url?.searchParams.get("country_code")])).toEqual([
      ["eq.medium", "gt.0", null],
      ["eq.medium", "gt.0", null],
    ]);
  });

  it("counts only the entry's own country for a country standing", async () => {
    Object.assign(mockBoard, { above: 0, total: 3 });

    await expect(getStanding(ENTRY_ID, "country")).resolves.toEqual({
      status: "ranked",
      standing: { difficulty: "medium", country: "SG", rank: 1, total: 3 },
    });
    expect(countRequests().map((url) => url.searchParams.get("country_code"))).toEqual(["eq.SG", "eq.SG"]);
  });

  it("reads an entry the leaderboard no longer has as missing, without counting anything", async () => {
    mockBoard.row = null;

    await expect(getStanding(ENTRY_ID, "world")).resolves.toEqual({ status: "missing" });
    expect(countRequests()).toEqual([]);
  });

  it("has no country standing for an entry sent with the world or before countries existed", async () => {
    const results = [];
    for (const row of [{ ...mediumRow, country_code: "ZZ" }, { ...mediumRow, country_code: undefined }]) {
      mockBoard.row = row;
      results.push(await getStanding(ENTRY_ID, "country"));
    }

    expect(results).toEqual([{ status: "noCountry" }, { status: "noCountry" }]);
    expect(countRequests()).toEqual([]);
  });

  it("says the board is unavailable when the lookup or a count fails, never a rank", async () => {
    const results = [];
    for (const failOn of ["row", "count"] as const) {
      mockBoard.failOn = failOn;
      results.push((await getStanding(ENTRY_ID, "world")).status);
    }

    expect(results).toEqual(["unavailable", "unavailable"]);
  });
});
