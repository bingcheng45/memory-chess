/** @jest-environment node */
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { GET } from "@/app/retired-sitemap.xml/route";
import { RETIRED_URLS_CHANGED_AT, retiredUrls } from "@/lib/seo/retiredUrls";
import { robotsFor, unprefixedPath } from "@/lib/seo/englishOnly";

describe("retired sitemap", () => {
  it("lists the translated Learn URLs Google indexed in August, including retired guides", () => {
    const urls = retiredUrls();

    expect(urls).toContain("https://thememorychess.com/de/learn/chess-memory-training");
    expect(urls).toContain("https://thememorychess.com/ja/learn");
    expect(urls).toContain("https://thememorychess.com/it/learn/working-memory-exercises-for-chess");
    expect(urls).toContain("https://thememorychess.com/ru/changelog");
    expect(urls).toContain("https://thememorychess.com/ru/leaderboard");
  });

  it("leaves out guides published after Google's last crawl, which it never indexed in translation", () => {
    expect(retiredUrls()).not.toContain("https://thememorychess.com/de/learn/memory-chess-vs-darksquares");
  });

  it("lists no URL the main sitemap offers, and no English URL", async () => {
    const live = new Set((await sitemap()).map((entry) => entry.url));

    for (const url of retiredUrls()) {
      expect(live.has(url)).toBe(false);
      expect(url).toMatch(/^https:\/\/thememorychess\.com\/[a-z]{2}(-[A-Z]{2})?\//);
    }
  });

  it("lists only URLs that are not indexable in their locale", () => {
    for (const url of retiredUrls()) {
      const pathname = new URL(url).pathname;
      const locale = pathname.split("/")[1];
      expect(robotsFor(unprefixedPath(pathname), locale)).toMatchObject({ index: false });
    }
  });

  it("serves the list as XML dated after Google's last crawl of 29 August", async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    expect(xml.match(/<url>/g)).toHaveLength(retiredUrls().length);
    expect(xml).toContain(`<lastmod>${RETIRED_URLS_CHANGED_AT}</lastmod>`);
    expect(RETIRED_URLS_CHANGED_AT > "2026-08-29").toBe(true);
  });

  it("is advertised in robots.txt beside the main sitemap", () => {
    expect(robots().sitemap).toEqual([
      "https://thememorychess.com/sitemap.xml",
      "https://thememorychess.com/retired-sitemap.xml",
    ]);
  });
});
