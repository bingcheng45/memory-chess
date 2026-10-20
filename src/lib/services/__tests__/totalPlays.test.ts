import { getGameMetric } from "@/lib/services/gameStatsService";
import { getTotalPlays } from "@/lib/services/totalPlays";

jest.mock("@/lib/services/gameStatsService", () => ({ getGameMetric: jest.fn() }));

const metric = (metric_value: unknown) => ({
  data: { id: "1", metric_name: "total_plays", metric_value, last_updated: "2026-10-19T18:30:00.000Z" },
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
