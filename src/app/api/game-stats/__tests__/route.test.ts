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

let nextAddress = 0;
const freshAddress = () => `203.0.113.${++nextAddress}`;

const send = (body: string, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest("http://localhost/api/game-stats", {
      method: "POST",
      body,
      headers: { "content-type": "application/json", "x-forwarded-for": freshAddress(), ...headers },
    }),
  );

const post = (body: unknown) => send(JSON.stringify(body));

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

describe("POST /api/game-stats guards", () => {
  beforeEach(() => increment.mockReset());

  it("answers 415 and counts nothing when the body is not declared as JSON", async () => {
    const response = await send(JSON.stringify({ metric: "total_plays", increment: 1 }), { "content-type": "text/plain" });

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Content-Type must be application/json" });
    expect(increment).not.toHaveBeenCalled();
  });

  it("answers 413 and counts nothing when the body passes the cap", async () => {
    const response = await send(JSON.stringify({ metric: "total_plays", increment: 1, padding: "x".repeat(200) }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Request body is too large" });
    expect(increment).not.toHaveBeenCalled();
  });

  it("answers 400 to a body that is not JSON", async () => {
    const response = await send("{nope");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON request body" });
  });

  it("answers 429 with Retry-After from the 31st count in a minute from one address, and still counts another address", async () => {
    increment.mockResolvedValue({ success: true, newValue: 7 });
    const body = JSON.stringify({ metric: "total_plays", increment: 1 });
    const script = { "x-forwarded-for": "198.51.100.9" };

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await send(body, script)).status);
    const refused = await send(body, script);

    expect(statuses.slice(0, 30)).toEqual(Array(30).fill(200));
    expect(statuses[30]).toBe(429);
    expect(await refused.json()).toEqual({ error: "Too many requests" });
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(increment).toHaveBeenCalledTimes(30);
    expect((await send(body)).status).toBe(200);
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
