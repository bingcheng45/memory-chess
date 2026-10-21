/** @jest-environment node */

import { GET } from "@/app/api/articles/stats/route";
import { ARTICLE_SLUGS } from "@/lib/articles/registry";
import { readArticleStats } from "@/lib/services/articleStatsService";

jest.mock("@/lib/services/articleStatsService", () => ({
  readArticleStats: jest.fn(),
}));

describe("GET /api/articles/stats", () => {
  it("answers every article's counts as rows the CDN keeps for five minutes", async () => {
    jest.mocked(readArticleStats).mockResolvedValue({
      "magnus-carlsen": { views: 2140, likes: 187 },
      "judit-polgar": { views: 4, likes: 0 },
    });

    const response = await GET();

    expect(readArticleStats).toHaveBeenCalledWith(ARTICLE_SLUGS);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=300, stale-while-revalidate=3600");
    expect(await response.json()).toEqual([
      { slug: "magnus-carlsen", views: 2140, likes: 187 },
      { slug: "judit-polgar", views: 4, likes: 0 },
    ]);
  });

  it("keeps no copy of a failed read", async () => {
    jest.mocked(readArticleStats).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBeNull();
    expect(await response.json()).toEqual({ error: "Article stats are unavailable" });
  });
});
