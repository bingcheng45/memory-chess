import sitemap from "@/app/sitemap";
import { EN_LEARN_PAGES as LEARN_PAGES } from "@/lib/seo/learn";

describe("sitemap", () => {
  it("includes static routes, learn article URLs, and the learn hub timestamp", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const learnHubEntry = entries.find(
      (entry) => entry.url === "https://thememorychess.com/learn",
    );

    for (const page of LEARN_PAGES) {
      expect(urls).toContain(`https://thememorychess.com/learn/${page.slug}`);
    }
    expect(urls).toContain("https://thememorychess.com/changelog");
    expect(urls).toContain("https://thememorychess.com/privacy");
    expect(new Date(learnHubEntry?.lastModified ?? 0).toISOString()).toBe(
      "2026-08-17T00:00:00.000Z",
    );
  });
});
