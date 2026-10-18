/** @jest-environment node */

import { parseCountryCode } from "@/lib/leaderboard/countries";
import type { LeaderboardSubmission } from "@/types/leaderboard";

const SINGAPORE = parseCountryCode("SG");
if (SINGAPORE === null) throw new Error("SG is not a known country code");

const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.fake-signature";
const ANON_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6ImFub24ifQ.fake-signature";

const inserts: string[] = [];

jest.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, key: string) => ({
    from: () => ({
      insert: (row: object) => {
        inserts.push(key);
        return { select: () => ({ single: async () => ({ data: { id: "1", ...row }, error: null }) }) };
      },
    }),
  }),
}));

const entry: LeaderboardSubmission = {
  player_name: "Poteto",
  country_code: SINGAPORE,
  difficulty: "medium",
  piece_count: 6,
  correct_pieces: 4,
  memorize_time: 8.25,
  solution_time: 12.5,
  total_wrong_pieces: 2,
  skill_rating: 1240,
};

async function submitTwice(env: { serviceKey?: string; readOnly?: boolean }) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  if (env.serviceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = env.serviceKey;
  if (env.readOnly) process.env.SUPABASE_READ_ONLY = "true";
  else delete process.env.SUPABASE_READ_ONLY;

  let leaderboard!: typeof import("@/lib/services/leaderboardService");
  await jest.isolateModulesAsync(async () => {
    leaderboard = await import("@/lib/services/leaderboardService");
  });
  return [await leaderboard.submitLeaderboardEntry(entry), await leaderboard.submitLeaderboardEntry(entry)];
}

let warn: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  inserts.length = 0;
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  error = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_READ_ONLY;
});

describe("the leaderboard writer", () => {
  it("inserts with the service key when SUPABASE_SERVICE_ROLE_KEY holds a service_role JWT, and logs nothing", async () => {
    const results = await submitTwice({ serviceKey: SERVICE_ROLE_JWT });

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual([SERVICE_ROLE_JWT, SERVICE_ROLE_JWT]);
    expect(warn.mock.calls).toEqual([]);
    expect(error.mock.calls).toEqual([]);
  });

  it("keeps inserting with the anon key when the service key is missing, and warns once", async () => {
    const results = await submitTwice({});

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual(["test-anon-key", "test-anon-key"]);
    expect(warn.mock.calls).toEqual([
      ["SUPABASE_SERVICE_ROLE_KEY is not set, so leaderboard scores are written with the anon key. Migration 0006 refuses those writes."],
    ]);
    expect(error.mock.calls).toEqual([]);
  });

  it("refuses an anon JWT pasted as the service key: inserts with the anon key and logs one error that names the role, not the key", async () => {
    const results = await submitTwice({ serviceKey: ANON_JWT });

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual(["test-anon-key", "test-anon-key"]);
    expect(warn.mock.calls).toEqual([]);
    expect(error.mock.calls).toEqual([
      [
        'SUPABASE_SERVICE_ROLE_KEY holds a key whose role is "anon", not "service_role", so leaderboard scores are written with the anon key. Migration 0006 refuses those writes. Set it to the service_role key from Supabase project settings, under API.',
      ],
    ]);
  });

  it("refuses a service key that is not a JWT: inserts with the anon key and logs one error", async () => {
    const results = await submitTwice({ serviceKey: "not-a-jwt" });

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual(["test-anon-key", "test-anon-key"]);
    expect(error.mock.calls).toEqual([
      [
        "SUPABASE_SERVICE_ROLE_KEY does not hold a Supabase JWT with a role, so leaderboard scores are written with the anon key. Migration 0006 refuses those writes. Set it to the service_role key from Supabase project settings, under API.",
      ],
    ]);
  });

  it("writes nothing when SUPABASE_READ_ONLY is set, even with the service key", async () => {
    const results = await submitTwice({ serviceKey: SERVICE_ROLE_JWT, readOnly: true });

    expect(results).toEqual([
      { status: "unavailable", cause: "Supabase is read-only (SUPABASE_READ_ONLY=true)" },
      { status: "unavailable", cause: "Supabase is read-only (SUPABASE_READ_ONLY=true)" },
    ]);
    expect(inserts).toEqual([]);
  });
});
