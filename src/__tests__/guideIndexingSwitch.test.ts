/** @jest-environment node */
import { NextRequest } from "next/server";

jest.mock("@/lib/seo/learn/translatedGuides", () => ({
  ...jest.requireActual("@/lib/seo/learn/translatedGuides"),
  isIndexedGuideLocale: (locale: string) => locale === "de",
}));

jest.mock("@/lib/seo/learn/servedGuides.json", () => ({
  "blindfold-chess-training-for-beginners": ["pt-BR", "fr", "de", "es"],
  "how-to-see-the-whole-board-in-chess": ["ru", "pt-BR", "fr", "es"],
  "chess-visualization-exercises": ["ru", "fr", "de", "es"],
  "how-to-stop-blundering-in-chess": ["ru", "pt-BR", "fr", "de", "es"],
  "how-to-get-better-at-chess-for-beginners": ["ru", "pt-BR", "fr", "es"],
}));

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => () =>
    new Response(null, { status: 200, headers: { Link: '<https://thememorychess.com/it/learn/x>; rel="alternate"; hreflang="it"' } }),
}));

import sitemap from "@/app/sitemap";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";
import { buildLearnPageMetadata } from "@/lib/seo/learnMetadata";
import middleware from "@/middleware";

const SITE = "https://thememorychess.com";
const BLUNDERING = "/learn/how-to-stop-blundering-in-chess";
const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };
const ALTERNATES = { en: BLUNDERING, de: `/de${BLUNDERING}`, "x-default": BLUNDERING };
const LINK =
  `<${SITE}${BLUNDERING}>; rel="alternate"; hreflang="en", ` +
  `<${SITE}/de${BLUNDERING}>; rel="alternate"; hreflang="de", ` +
  `<${SITE}${BLUNDERING}>; rel="alternate"; hreflang="x-default"`;

const blundering = () => {
  const page = EN_LEARN_PAGES.find((entry) => entry.meta.slug === "how-to-stop-blundering-in-chess");
  if (!page) throw new Error("no blundering guide");
  return page;
};
const run = (path: string) => middleware(new NextRequest(`${SITE}${path}`));

describe("turning on indexing for one locale's translated guides", () => {
  it("makes that locale's translation indexable and leaves the others noindex", () => {
    expect("robots" in buildLearnPageMetadata(blundering(), "de")).toBe(false);
    expect("robots" in buildLearnPageMetadata(blundering())).toBe(false);
    expect(buildLearnPageMetadata(blundering(), "fr").robots).toEqual(NOINDEX_FOLLOW);
  });

  it("names English and that locale, and no other, as the guide's hreflang alternates", () => {
    expect(buildLearnPageMetadata(blundering()).alternates).toEqual({ canonical: BLUNDERING, languages: ALTERNATES });
    expect(buildLearnPageMetadata(blundering(), "de").alternates).toEqual({ canonical: `/de${BLUNDERING}`, languages: ALTERNATES });
    expect(buildLearnPageMetadata(blundering(), "fr").alternates).toEqual({ canonical: `/fr${BLUNDERING}`, languages: ALTERNATES });
  });

  it("lists the English and that locale's URL in the sitemap, each with the same alternates", async () => {
    const entries = (await sitemap()).filter((entry) => entry.url.endsWith(BLUNDERING));

    expect(entries.map((entry) => [entry.url, entry.alternates])).toEqual([
      [`${SITE}${BLUNDERING}`, { languages: { en: `${SITE}${BLUNDERING}`, de: `${SITE}/de${BLUNDERING}`, "x-default": `${SITE}${BLUNDERING}` } }],
      [`${SITE}/de${BLUNDERING}`, { languages: { en: `${SITE}${BLUNDERING}`, de: `${SITE}/de${BLUNDERING}`, "x-default": `${SITE}${BLUNDERING}` } }],
    ]);
  });

  it("sends the same alternates in the Link header as the HTML, and none on a guide whose German is withheld", () => {
    expect(run(BLUNDERING).headers.get("Link")).toBe(LINK);
    expect(run(`/de${BLUNDERING}`).headers.get("Link")).toBe(LINK);
    expect(run(`/fr${BLUNDERING}`).headers.get("Link")).toBe(LINK);
    expect(run("/learn/how-to-get-better-at-chess-for-beginners").headers.get("Link")).toBeNull();
  });
});

describe("a translation withheld until it is approved again", () => {
  it("answers a temporary redirect to the English guide, while a locale that never had the guide answers a permanent one", () => {
    const withheld = run("/ru/learn/blindfold-chess-training-for-beginners");
    const never = run("/it/learn/blindfold-chess-training-for-beginners");

    expect([withheld.status, withheld.headers.get("location")]).toEqual([307, `${SITE}/learn/blindfold-chess-training-for-beginners`]);
    expect([never.status, never.headers.get("location")]).toEqual([308, `${SITE}/learn/blindfold-chess-training-for-beginners`]);
  });

  it("keeps the locales still served, and drops the withheld one from the sitemap and the alternates", async () => {
    expect(run("/fr/learn/blindfold-chess-training-for-beginners").status).toBe(200);
    expect(run("/de/learn/how-to-get-better-at-chess-for-beginners").status).toBe(307);
    const entries = (await sitemap()).filter((entry) => entry.url.endsWith("/learn/how-to-get-better-at-chess-for-beginners"));
    expect(entries.map((entry) => [entry.url, entry.alternates])).toEqual([[`${SITE}/learn/how-to-get-better-at-chess-for-beginners`, undefined]]);
  });

  it("sends a retired guide's German readers to English for now when the guide's German is withheld", () => {
    const retired = run("/de/learn/chess-board-vision-drills");
    expect([retired.status, retired.headers.get("location")]).toEqual([307, `${SITE}/learn/how-to-see-the-whole-board-in-chess`]);
  });

  it("answers a temporary redirect for a withheld translation reached by a trailing slash or the /pt short code", () => {
    const slashed = run("/ru/learn/blindfold-chess-training-for-beginners/");
    const short = run("/pt/learn/chess-visualization-exercises");

    expect([slashed.status, slashed.headers.get("location")]).toEqual([307, `${SITE}/learn/blindfold-chess-training-for-beginners`]);
    expect([short.status, short.headers.get("location")]).toEqual([307, `${SITE}/learn/chess-visualization-exercises`]);
  });
});
