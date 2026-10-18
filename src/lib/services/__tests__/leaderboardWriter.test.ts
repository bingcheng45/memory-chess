/** @jest-environment node */

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

const entry = {
  player_name: "Poteto",
  country_code: "SG",
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
  if (env.serviceKey === undefined) delete process.env.LEADERBOARD_SUPABASE_SERVICE_KEY;
  else process.env.LEADERBOARD_SUPABASE_SERVICE_KEY = env.serviceKey;
  if (env.readOnly) process.env.SUPABASE_READ_ONLY = "true";
  else delete process.env.SUPABASE_READ_ONLY;

  let leaderboard!: typeof import("@/lib/services/leaderboardService");
  await jest.isolateModulesAsync(async () => {
    leaderboard = await import("@/lib/services/leaderboardService");
  });
  return [await leaderboard.submitLeaderboardEntry(entry as never), await leaderboard.submitLeaderboardEntry(entry as never)];
}

let warn: jest.SpyInstance;

beforeEach(() => {
  inserts.length = 0;
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.LEADERBOARD_SUPABASE_SERVICE_KEY;
  delete process.env.SUPABASE_READ_ONLY;
});

describe("the leaderboard writer", () => {
  it("inserts with the service key when LEADERBOARD_SUPABASE_SERVICE_KEY is set, and warns about nothing", async () => {
    const results = await submitTwice({ serviceKey: "test-service-key" });

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual(["test-service-key", "test-service-key"]);
    expect(warn.mock.calls).toEqual([]);
  });

  it("keeps inserting with the anon key when the service key is missing, and warns once", async () => {
    const results = await submitTwice({});

    expect(results.map((result) => result.status)).toEqual(["stored", "stored"]);
    expect(inserts).toEqual(["test-anon-key", "test-anon-key"]);
    expect(warn.mock.calls).toEqual([
      ["LEADERBOARD_SUPABASE_SERVICE_KEY is not set, so leaderboard scores are written with the anon key. Migration 0006 refuses those writes."],
    ]);
  });

  it("writes nothing when SUPABASE_READ_ONLY is set, even with the service key", async () => {
    const results = await submitTwice({ serviceKey: "test-service-key", readOnly: true });

    expect(results).toEqual([
      { status: "unavailable", cause: "Supabase is read-only (SUPABASE_READ_ONLY=true)" },
      { status: "unavailable", cause: "Supabase is read-only (SUPABASE_READ_ONLY=true)" },
    ]);
    expect(inserts).toEqual([]);
  });
});
