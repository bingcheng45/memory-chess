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

  it("dates every entry, and none of them in the future", async () => {
    // The dates used to come from each source file's mtime, which a fresh
    // clone rewrites: on a deployment every page claimed to have changed at
    // the moment of the build. They are stated now, so what is worth checking
    // is that each one is real and none has been typed with a later year than
    // the day it was written.
    const entries = await sitemap();
    const now = Date.now();

    for (const entry of entries) {
      const stamped = new Date(entry.lastModified ?? NaN);

      expect(Number.isNaN(stamped.getTime())).toBe(false);
      expect(stamped.getTime()).toBeLessThanOrEqual(now);
    }
  });

  it("takes the changelog's date from the changelog itself", async () => {
    // Publishing an entry is the change, so this one needs no upkeep.
    const { LATEST_CHANGELOG_ENTRY } = await import("@/lib/changelog");
    const entries = await sitemap();
    const changelogEntry = entries.find(
      (entry) => entry.url === "https://thememorychess.com/changelog",
    );

    expect(new Date(changelogEntry?.lastModified ?? 0).toISOString()).toBe(
      new Date(LATEST_CHANGELOG_ENTRY.publishedAt).toISOString(),
    );
  });

  it("lists the English-only pages once, not once per locale", async () => {
    // /about and /terms serve identical English text on every locale prefix.
    // Announcing 24 copies of each would be a duplicate-content signal, the
    // same reasoning already applied to /privacy.
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const path of ["/about", "/terms", "/privacy"]) {
      expect(
        urls.filter((url) => url.endsWith(path)),
      ).toEqual([`https://thememorychess.com${path}`]);
    }
  });

  it("leaves settings out, the one route that asks not to be indexed", async () => {
    const entries = await sitemap();

    expect(
      entries.filter((entry) => entry.url.includes("/settings")),
    ).toHaveLength(0);
  });
});
