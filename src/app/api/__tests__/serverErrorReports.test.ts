/** @jest-environment node */

import { NextRequest } from "next/server";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";
import { recordArticleEvent } from "@/lib/services/articleStatsService";

const SUPABASE_URL = "http://supabase.test";
const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.fake-signature";
const ANON_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6ImFub24ifQ.fake-signature";
const DEPLOY = "e891778cabb5b45da7cdd343b015e0da53aeae73";
const ENTRY_ID = "8a6f2d4e-3b1c-4f5a-9e7d-2c1b0a9f8e7d";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_JWT;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_JWT;
process.env.VERCEL_GIT_COMMIT_SHA = DEPLOY;
delete process.env.SUPABASE_READ_ONLY;

jest.mock("@/lib/server/googleSheets", () => ({
  ...jest.requireActual("@/lib/server/googleSheets"),
  appendGoogleSheetRow: jest.fn(),
}));
jest.mock("@/lib/services/gameStatsService", () => ({
  ...jest.requireActual("@/lib/services/gameStatsService"),
  getAllGameMetrics: jest.fn(),
  incrementGameMetric: jest.fn(),
}));
jest.mock("@/lib/services/articleStatsService", () => ({ recordArticleEvent: jest.fn() }));

type Report = { readonly authorization: string | null; readonly row: unknown };

const reports: Report[] = [];
const OUTAGE = { code: "PGRST002", message: "Could not query the database for the schema cache. Retrying.", details: null, hint: null };

function headerOf(init: RequestInit | undefined, name: string): string | null {
  return new Headers(init?.headers).get(name);
}

async function fakeSupabase(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.pathname === "/rest/v1/server_errors") {
    reports.push({ authorization: headerOf(init, "authorization"), row: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 201 });
  }
  if (init?.method === "HEAD") return new Response(null, { status: 200, headers: { "content-range": "*/0" } });
  if (init?.method === "POST") {
    return Response.json(
      {
        code: "23514",
        message: 'new row for relation "leaderboard_entries" violates check constraint "check_board_piece_count"',
        details: "Failing row contains (Dino beta, medium, 6, 4, 8.25, 12.5, ...)",
        hint: null,
      },
      { status: 400 },
    );
  }
  return Response.json(OUTAGE, { status: 503 });
}

async function settled(): Promise<readonly Report[]> {
  for (let tick = 0; tick < 20; tick += 1) await new Promise((resolve) => setImmediate(resolve));
  return reports;
}

const rowsOnly = (given: readonly Report[]) => given.map(({ row }) => row);

const leaderboard = () => import("@/app/api/leaderboard/route");
const gameStats = () => import("@/lib/services/gameStatsService");

const SCORE = {
  player_name: "Dino beta",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
};

function jsonRequest(path: string, body: unknown, address = "198.51.100.23") {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": address },
    body: JSON.stringify(body),
  });
}

function rawRequest(path: string, body: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.24" },
    body,
  });
}

beforeEach(() => {
  reports.length = 0;
  jest.spyOn(global, "fetch").mockImplementation(fakeSupabase);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("a failing API route keeps a redacted row in server_errors", () => {
  it("stores one row with the service key when a leaderboard read fails, and the board answers 503", async () => {
    const { GET } = await leaderboard();

    const response = await GET(new NextRequest("http://localhost/api/leaderboard?difficulty=hard"));
    const given = await settled();

    expect(response.status).toBe(503);
    expect(given).toEqual([
      {
        authorization: `Bearer ${SERVICE_ROLE_JWT}`,
        row: {
          route: "leaderboard read",
          kind: "unavailable",
          message: "Could not query the database for the schema cache. Retrying.",
          detail: { code: "PGRST002", board: "hard" },
          deploy: DEPLOY,
        },
      },
    ]);
  });

  it("stores the database's words for a refused score, never the failing row with the player name, and the score answers 500", async () => {
    const { POST } = await leaderboard();

    const response = await POST(jsonRequest("/api/leaderboard", SCORE));
    const given = await settled();

    expect(response.status).toBe(500);
    expect(rowsOnly(given)).toEqual([
      {
        route: "POST /api/leaderboard",
        kind: "failed",
        message: 'new row for relation "leaderboard_entries" violates check constraint "check_board_piece_count"',
        detail: { code: "23514", board: "medium" },
        deploy: DEPLOY,
      },
    ]);
    expect(JSON.stringify(given)).not.toContain("Dino beta");
  });

  it("stores the standing check's outage", async () => {
    const { GET } = await import("@/app/api/leaderboard/rank/route");

    const response = await GET(new NextRequest(`http://localhost/api/leaderboard/rank?id=${ENTRY_ID}`));

    expect(response.status).toBe(503);
    expect(rowsOnly(await settled())).toEqual([
      expect.objectContaining({ route: "GET /api/leaderboard/rank", kind: "unavailable", detail: { code: "PGRST002" } }),
    ]);
  });

  it("stores a failed feedback write", async () => {
    jest.mocked(appendGoogleSheetRow).mockRejectedValue(new Error("The caller does not have permission"));
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(
      jsonRequest("/api/feedback", {
        rating: 4,
        feedback: "Fun board",
        accuracy: 100,
        correctPieces: 6,
        pieceCount: 6,
        difficulty: "medium",
        memorizationTime: 9,
        solutionTime: 12.5,
      }),
    );

    expect(response.status).toBe(500);
    expect(rowsOnly(await settled())).toEqual([
      expect.objectContaining({ route: "POST /api/feedback", kind: "failed", message: "The caller does not have permission" }),
    ]);
  });

  it("stores a contact form failure without the visitor's email, which the sheet's error may repeat", async () => {
    jest.mocked(appendGoogleSheetRow).mockRejectedValueOnce(new SheetsConfigError("GOOGLE_SHEET_ID is not set"));
    jest.mocked(appendGoogleSheetRow).mockRejectedValueOnce(new Error("Unable to parse range for ada@example.com"));
    const { POST } = await import("@/app/api/contact/route");
    const message = { name: "Ada", email: "ada@example.com", type: "inquiry", message: "Hello there, a question." };

    const statuses = [(await POST(jsonRequest("/api/contact", message))).status, (await POST(jsonRequest("/api/contact", message))).status];

    expect(statuses).toEqual([503, 502]);
    expect(rowsOnly(await settled())).toEqual(
      expect.arrayContaining([
        { route: "POST /api/contact", kind: "unavailable", message: "GOOGLE_SHEET_ID is not set", detail: {}, deploy: DEPLOY },
        { route: "POST /api/contact", kind: "failed", message: "Unable to parse range for [email]", detail: {}, deploy: DEPLOY },
      ]),
    );
    expect(reports).toHaveLength(2);
  });

  it("stores a feedback sheet that is not configured as unavailable", async () => {
    jest.mocked(appendGoogleSheetRow).mockRejectedValue(new SheetsConfigError("Google Sheet ID is missing"));
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(
      jsonRequest("/api/feedback", {
        rating: 5,
        feedback: "",
        accuracy: 100,
        correctPieces: 6,
        pieceCount: 6,
        difficulty: "medium",
        memorizationTime: 9,
        solutionTime: 12.5,
      }),
    );

    expect(response.status).toBe(500);
    expect(rowsOnly(await settled())).toEqual([
      { route: "POST /api/feedback", kind: "unavailable", message: "Google Sheet ID is missing", detail: { name: "SheetsConfigError" }, deploy: DEPLOY },
    ]);
  });

  it("stores a play counter that could not count, and tells the player only that it failed", async () => {
    const { incrementGameMetric } = await gameStats();
    jest.mocked(incrementGameMetric).mockResolvedValue({ success: false, error: "Failed to increment metric: timeout" });
    const { POST } = await import("@/app/api/game-stats/route");

    const response = await POST(jsonRequest("/api/game-stats", { metric: "total_plays" }));

    expect([response.status, await response.json()]).toEqual([500, { error: "The play could not be counted" }]);
    expect(rowsOnly(await settled())).toEqual([
      { route: "POST /api/game-stats", kind: "failed", message: "Failed to increment metric: timeout", detail: {}, deploy: DEPLOY },
    ]);
  });

  it("stores a play counter or stats read that could not reach the database as unavailable", async () => {
    const { getAllGameMetrics, incrementGameMetric } = await gameStats();
    jest.mocked(incrementGameMetric).mockResolvedValue({ success: false, error: "Database connection issue: fetch failed" });
    jest.mocked(getAllGameMetrics).mockResolvedValue({ data: [], error: "Database connection issue: fetch failed" });
    const { GET, POST } = await import("@/app/api/game-stats/route");

    const posted = await POST(jsonRequest("/api/game-stats", { metric: "total_plays", increment: 1 }));
    const read = await GET(new NextRequest("http://localhost/api/game-stats"));

    expect([posted.status, await posted.json(), read.status, await read.json()]).toEqual([
      500,
      { error: "The play could not be counted" },
      500,
      { error: "Game stats are unavailable" },
    ]);
    expect(rowsOnly(await settled())).toEqual(
      expect.arrayContaining([
        { route: "POST /api/game-stats", kind: "unavailable", message: "Database connection issue: fetch failed", detail: {}, deploy: DEPLOY },
        { route: "GET /api/game-stats", kind: "unavailable", message: "Database connection issue: fetch failed", detail: {}, deploy: DEPLOY },
      ]),
    );
    expect(reports).toHaveLength(2);
  });

  it("stores an article like that failed, with the article's slug", async () => {
    jest.mocked(recordArticleEvent).mockResolvedValue({
      status: "failed",
      cause: { code: "57014", message: "canceling statement due to statement timeout" },
    });
    const { POST } = await import("@/app/api/articles/[slug]/stats/route");

    const response = await POST(
      new Request("http://localhost/api/articles/magnus-carlsen/stats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"event":"like"}',
      }),
      { params: Promise.resolve({ slug: "magnus-carlsen" }) },
    );

    expect(response.status).toBe(500);
    expect(rowsOnly(await settled())).toEqual([
      {
        route: "POST /api/articles/stats",
        kind: "failed",
        message: "canceling statement due to statement timeout",
        detail: { code: "57014", slug: "magnus-carlsen" },
        deploy: DEPLOY,
      },
    ]);
  });
});

describe("a client's mistake is answered 400 and stores nothing", () => {
  it.each([
    ["a leaderboard score that is not JSON", "/api/leaderboard", '{"player_name": Alice Smit"', "Invalid JSON request body"],
    ["a leaderboard score that is null", "/api/leaderboard", "null", "Missing required fields"],
    [
      "a leaderboard score with an endless rebuild time",
      "/api/leaderboard",
      '{"player_name":"Dino beta","difficulty":"medium","piece_count":6,"correct_pieces":4,"memorize_time":8.25,"solution_time":1e400,"total_wrong_pieces":2}',
      "A rebuild of 6 pieces takes at least 1.5 seconds",
    ],
    ["a play count that is not JSON", "/api/game-stats", '{"metric": total_plays', "Invalid JSON request body"],
    ["a play count that is null", "/api/game-stats", "null", "Missing required field: metric"],
    ["a play count of an unknown metric", "/api/game-stats", '{"metric":"total_wins"}', "Unknown metric"],
    ["a play count with text for the increment", "/api/game-stats", '{"metric":"total_plays","increment":"Bob Jones"}', "The increment must be 1"],
    ["a play count of more than one", "/api/game-stats", '{"metric":"total_plays","increment":5}', "The increment must be 1"],
  ])("%s", async (_, path, body, error) => {
    const { POST } = await import(path === "/api/leaderboard" ? "@/app/api/leaderboard/route" : "@/app/api/game-stats/route");

    const { incrementGameMetric } = await gameStats();
    jest.mocked(incrementGameMetric).mockClear();

    const response = await POST(rawRequest(path, body));

    expect([response.status, await response.json()]).toEqual([400, { error }]);
    expect(await settled()).toEqual([]);
    expect(jest.mocked(incrementGameMetric).mock.calls).toEqual([]);
  });
});
