import { getGameMetric } from "@/lib/services/gameStatsService";
import { getTotalPlays } from "@/lib/services/totalPlays";

jest.mock("@/lib/services/gameStatsService", () => ({ getGameMetric: jest.fn() }));
jest.mock("@/lib/supabase", () => ({ supabase: {} }));

const metric = (metric_value: unknown) => ({
  data: { id: "1", metric_name: "total_plays", metric_value, last_updated: "2026-10-19T18:30:00.000Z" },
});

const env = process.env as Record<string, string | undefined>;
const original = { NODE_ENV: env.NODE_ENV, NEXT_PHASE: env.NEXT_PHASE };

function restore(name: keyof typeof original) {
  if (original[name] === undefined) delete env[name];
  else env[name] = original[name];
}

afterEach(() => {
  restore("NODE_ENV");
  restore("NEXT_PHASE");
});

describe("getTotalPlays", () => {
  it("reads the count Postgres sends as a numeric string", async () => {
    jest.mocked(getGameMetric).mockResolvedValue(metric("49631") as never);

    expect(await getTotalPlays()).toEqual({ plays: 49631, asOf: "2026-10-19T18:30:00.000Z" });
  });

  it("reads a count that arrives as a number", async () => {
    jest.mocked(getGameMetric).mockResolvedValue(metric(49631) as never);

    expect(await getTotalPlays()).toEqual({ plays: 49631, asOf: "2026-10-19T18:30:00.000Z" });
  });

  it("gives nothing when the metric cannot be read", async () => {
    jest.mocked(getGameMetric).mockResolvedValue({ data: null, error: "Database connection issue: down" });

    expect(await getTotalPlays()).toBeNull();
  });

  it("gives nothing when there is no total_plays row", async () => {
    jest.mocked(getGameMetric).mockResolvedValue({ data: null });

    expect(await getTotalPlays()).toBeNull();
  });

  it.each([null, ""])("gives nothing rather than zero when the stored value is %p", async (value) => {
    jest.mocked(getGameMetric).mockResolvedValue(metric(value) as never);

    expect(await getTotalPlays()).toBeNull();
  });

  it("gives nothing when the stored value is not a number", async () => {
    jest.mocked(getGameMetric).mockResolvedValue(metric("lots") as never);

    expect(await getTotalPlays()).toBeNull();
  });
});

describe("getTotalPlays in a production build", () => {
  it("gives nothing when the count cannot be read, so a deploy with Supabase down still succeeds", async () => {
    env.NODE_ENV = "production";
    env.NEXT_PHASE = "phase-production-build";
    jest.mocked(getGameMetric).mockResolvedValue({ data: null, error: "Database connection issue: fetch failed" });

    expect(await getTotalPlays()).toBeNull();
  });

  it("gives nothing when Supabase is not configured", async () => {
    const supabaseModule = jest.requireMock<{ supabase: object | null }>("@/lib/supabase");
    supabaseModule.supabase = null;
    try {
      expect(await getTotalPlays()).toBeNull();
    } finally {
      supabaseModule.supabase = {};
    }
  });
});
