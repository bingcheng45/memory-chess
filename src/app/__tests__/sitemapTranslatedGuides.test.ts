import sitemap from "@/app/sitemap";

const SITE = "https://thememorychess.com";
const ALTERNATES = {
  en: `${SITE}/learn/chess-visualization-exercises`,
  ru: `${SITE}/ru/learn/chess-visualization-exercises`,
  "pt-BR": `${SITE}/pt-BR/learn/chess-visualization-exercises`,
  fr: `${SITE}/fr/learn/chess-visualization-exercises`,
  de: `${SITE}/de/learn/chess-visualization-exercises`,
  es: `${SITE}/es/learn/chess-visualization-exercises`,
  "x-default": `${SITE}/learn/chess-visualization-exercises`,
};

describe("sitemap entries of the translated guides", () => {
  it("lists a translated guide once per served locale, each with the same alternates", async () => {
    const entries = (await sitemap()).filter((entry) => entry.url.endsWith("/learn/chess-visualization-exercises"));

    expect(entries.map((entry) => entry.url)).toEqual(Object.values(ALTERNATES).slice(0, 6));
    for (const entry of entries) expect(entry.alternates).toEqual({ languages: ALTERNATES });
  });

  it("lists an untranslated guide and the hub at the English URL alone, with no alternates", async () => {
    const entries = (await sitemap()).filter((entry) => /\/learn(\/chess-memory-training)?$/.test(entry.url));

    expect(entries.map((entry) => [entry.url, entry.alternates])).toEqual([
      [`${SITE}/learn`, undefined],
      [`${SITE}/learn/chess-memory-training`, undefined],
    ]);
  });
});
