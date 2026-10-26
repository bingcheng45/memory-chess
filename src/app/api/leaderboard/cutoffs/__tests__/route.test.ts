/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, dynamic } from "@/app/api/leaderboard/cutoffs/route";
import { getLeaderboardCutoffs } from "@/lib/services/leaderboardService";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboardCutoffs: jest.fn(),
}));

const mockGetCutoffs = jest.mocked(getLeaderboardCutoffs);
const CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

const cutoffsRequest = (search = "") =>
  new NextRequest(`http://localhost/api/leaderboard/cutoffs${search}`);

describe("GET /api/leaderboard/cutoffs", () => {
  beforeEach(() => {
    mockGetCutoffs.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("is rendered per request so the CDN, not ISR, holds the answer", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("returns the cutoffs under data with the CDN cache header", async () => {
    const cutoffs = { easy: 12, medium: 9 } as unknown as Awaited<ReturnType<typeof getLeaderboardCutoffs>>;
    mockGetCutoffs.mockResolvedValue(cutoffs);

    const response = await GET(cutoffsRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(CACHE);
    expect(await response.json()).toEqual({ data: cutoffs });
  });

  it("still answers 200 with data null, and no 5 minute cache header, when the cutoffs cannot be read", async () => {
    mockGetCutoffs.mockRejectedValue(new Error("db down"));

    const response = await GET(cutoffsRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: null });
  });

  it("does not cache a null answer from the service, which is how an outage reports itself", async () => {
    mockGetCutoffs.mockResolvedValue(null);

    const response = await GET(cutoffsRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ data: null });
  });

  it("redirects a request with a query string to the bare path before any database work", async () => {
    const response = await GET(cutoffsRequest("?x=123"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost/api/leaderboard/cutoffs");
    expect(mockGetCutoffs).not.toHaveBeenCalled();
  });
});
