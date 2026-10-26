/** @jest-environment node */

import { GET, dynamic } from "@/app/api/leaderboard/cutoffs/route";
import { getLeaderboardCutoffs } from "@/lib/services/leaderboardService";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboardCutoffs: jest.fn(),
}));

const mockGetCutoffs = jest.mocked(getLeaderboardCutoffs);
const CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

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

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(CACHE);
    expect(await response.json()).toEqual({ data: cutoffs });
  });

  it("still answers 200 with data null, and no 5 minute cache header, when the cutoffs cannot be read", async () => {
    mockGetCutoffs.mockRejectedValue(new Error("db down"));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).not.toBe(CACHE);
    expect(await response.json()).toEqual({ data: null });
  });
});
