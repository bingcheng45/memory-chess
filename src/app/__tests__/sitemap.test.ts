import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("includes the new learn article URLs and updates the learn hub timestamp", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const learnHubEntry = entries.find(
      (entry) => entry.url === "https://thememorychess.com/learn",
    );

    expect(urls).toContain(
      "https://thememorychess.com/learn/whats-trending-in-chess-2026",
    );
    expect(urls).toContain(
      "https://thememorychess.com/learn/most-impressive-chess-memory-feats-ranked",
    );
    expect(learnHubEntry?.lastModified?.toISOString()).toBe(
      "2026-03-23T00:00:00.000Z",
    );
  });
});
