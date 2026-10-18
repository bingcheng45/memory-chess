/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/game-stats/route";
import { getGameMetric, incrementGameMetric } from "@/lib/services/gameStatsService";

jest.mock("@/lib/services/gameStatsService", () => ({
  ...jest.requireActual("@/lib/services/gameStatsService"),
  getAllGameMetrics: jest.fn(),
  getGameMetric: jest.fn(),
  incrementGameMetric: jest.fn(),
}));

const increment = incrementGameMetric as jest.MockedFunction<typeof incrementGameMetric>;

const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/game-stats", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/game-stats", () => {
  it("answers the new total of the metric it was asked to count", async () => {
    increment.mockResolvedValue({ success: true, newValue: 1043 });

    const response = await post({ metric: "total_plays", increment: 1 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { metric: "total_plays", value: 1043 } });
  });

  it("answers 500 without the database's words when the count fails", async () => {
    increment.mockResolvedValue({ success: false, error: 'Failed to increment metric: relation "public.game_stats" does not exist' });

    const response = await post({ metric: "total_plays", increment: 1 });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "The play could not be counted" });
  });

  it("answers 400 without a metric", async () => {
    const response = await post({ increment: 1 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing required field: metric" });
  });
});

describe("GET /api/game-stats?metric=total_plays", () => {
  const get = () => GET(new NextRequest("http://localhost/api/game-stats?metric=total_plays"));

  it("lets the edge keep the count for a minute and serve it stale for ten while it refreshes", async () => {
    jest.mocked(getGameMetric).mockResolvedValue({ data: { metric_name: "total_plays", metric_value: 1043 } } as never);

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=600");
  });

  it("keeps no copy of a failed read", async () => {
    jest.mocked(getGameMetric).mockResolvedValue({ data: null, error: "connection refused" } as never);

    const response = await get();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBeNull();
  });
});
