/** @jest-environment node */

const READ_ONLY_REASON = "Supabase is read-only (SUPABASE_READ_ONLY=true)";
const WRITE_METHODS = ["insert", "update", "upsert", "delete", "rpc"];
const ROWS = [{ id: "1", player_name: "Poteto", difficulty: "medium" }];

const calls: string[] = [];

const chain: unknown = new Proxy(() => undefined, {
  get(_target, method: string) {
    if (method === "then") {
      return (resolve: (value: unknown) => unknown) =>
        resolve({ data: ROWS, error: null, count: ROWS.length });
    }
    return () => {
      calls.push(method);
      return chain;
    };
  },
});

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => chain,
    rpc: () => {
      calls.push("rpc");
      return chain;
    },
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

async function loadServices(readOnly: boolean) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  if (readOnly) process.env.SUPABASE_READ_ONLY = "true";
  else delete process.env.SUPABASE_READ_ONLY;

  let services!: {
    leaderboard: typeof import("@/lib/services/leaderboardService");
    gameStats: typeof import("@/lib/services/gameStatsService");
    articleStats: typeof import("@/lib/services/articleStatsService");
  };
  await jest.isolateModulesAsync(async () => {
    services = {
      leaderboard: await import("@/lib/services/leaderboardService"),
      gameStats: await import("@/lib/services/gameStatsService"),
      articleStats: await import("@/lib/services/articleStatsService"),
    };
  });
  return services;
}

const writesAttempted = () => calls.filter((method) => WRITE_METHODS.includes(method));

beforeEach(() => {
  calls.length = 0;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.SUPABASE_READ_ONLY;
});

describe("SUPABASE_READ_ONLY=true", () => {
  it("answers a leaderboard submission as unavailable without writing", async () => {
    const { leaderboard } = await loadServices(true);

    const result = await leaderboard.submitLeaderboardEntry(entry as never);

    expect(result).toEqual({ status: "unavailable", cause: READ_ONLY_REASON });
    expect(writesAttempted()).toEqual([]);
  });

  it("fails a game metric increment without writing", async () => {
    const { gameStats } = await loadServices(true);

    const result = await gameStats.incrementGameMetric("total_plays");

    expect(result).toEqual({
      success: false,
      error: `Database connection issue: ${READ_ONLY_REASON}`,
    });
    expect(writesAttempted()).toEqual([]);
  });

  it("answers an article event as unavailable without writing", async () => {
    const { articleStats } = await loadServices(true);

    const result = await articleStats.recordArticleEvent("magnus-carlsen", "view");

    expect(result).toEqual({ status: "unavailable", cause: READ_ONLY_REASON });
    expect(writesAttempted()).toEqual([]);
  });

  it("still reads leaderboard rows and game metrics", async () => {
    const { leaderboard, gameStats } = await loadServices(true);

    expect(await leaderboard.getLeaderboard({ difficulty: "medium" })).toEqual({ data: ROWS });
    expect(await gameStats.getAllGameMetrics()).toEqual({ data: ROWS });
    expect(writesAttempted()).toEqual([]);
  });
});

describe("SUPABASE_READ_ONLY unset", () => {
  it("writes through the same client", async () => {
    const { leaderboard, gameStats, articleStats } = await loadServices(false);

    await leaderboard.submitLeaderboardEntry(entry as never);
    await gameStats.incrementGameMetric("total_plays");
    await articleStats.recordArticleEvent("magnus-carlsen", "view");

    expect(writesAttempted()).toEqual(expect.arrayContaining(["insert", "rpc"]));
  });
});
