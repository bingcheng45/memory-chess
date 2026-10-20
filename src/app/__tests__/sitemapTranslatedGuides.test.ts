import sitemap from "@/app/sitemap";

const SITE = "https://thememorychess.com";

describe("sitemap entries of the translated guides", () => {
  it("lists a translated guide at its English URL alone, with no alternates, while no locale is indexed", async () => {
    const entries = (await sitemap()).filter((entry) => entry.url.endsWith("/learn/chess-visualization-exercises"));

    expect(entries.map((entry) => [entry.url, entry.alternates])).toEqual([[`${SITE}/learn/chess-visualization-exercises`, undefined]]);
  });

  it("lists an untranslated guide and the hub at the English URL alone, with no alternates", async () => {
    const entries = (await sitemap()).filter((entry) => /\/learn(\/chess-memory-training)?$/.test(entry.url));

    expect(entries.map((entry) => [entry.url, entry.alternates])).toEqual([
      [`${SITE}/learn`, undefined],
      [`${SITE}/learn/chess-memory-training`, undefined],
    ]);
  });
});
