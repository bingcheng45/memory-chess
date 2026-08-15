import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("includes static routes, learn article URLs, and the learn hub timestamp", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const learnHubEntry = entries.find(
      (entry) => entry.url === "https://thememorychess.com/learn",
    );

    expect(urls).toContain(
      "https://thememorychess.com/learn/how-to-get-better-at-chess-for-beginners",
    );
    expect(urls).toContain(
      "https://thememorychess.com/learn/chess-calculation-exercises-for-beginners",
    );
    expect(urls).toContain("https://thememorychess.com/changelog");
    expect(urls).toContain("https://thememorychess.com/privacy");
    expect(new Date(learnHubEntry?.lastModified ?? 0).toISOString()).toBe(
      "2026-03-23T00:00:00.000Z",
    );
  });
});
