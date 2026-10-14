/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/game-stats/route";
import { incrementGameMetric } from "@/lib/services/gameStatsService";

jest.mock("@/lib/services/gameStatsService", () => ({
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

  it("answers 500 with the service's error when the count fails", async () => {
    increment.mockResolvedValue({ success: false, error: "Failed to increment metric: invalid metric" });

    const response = await post({ metric: "total_plays", increment: 1 });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to increment metric: invalid metric" });
  });

  it("answers 400 without a metric", async () => {
    const response = await post({ increment: 1 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing required field: metric" });
  });
});
