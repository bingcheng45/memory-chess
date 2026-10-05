import sitemap from "@/app/sitemap";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/routing";
import { DEFAULT_LOCALE_INDEXED_ROUTES, ENGLISH_ONLY_ROUTES } from "@/lib/seo/englishOnly";
import { ARTICLE_SLUGS } from "@/lib/articles";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";

jest.mock("@/lib/articles/translatedLocales");

const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);
const SITE_URL = "https://thememorychess.com";
const LISTED_IN_ENGLISH_ONLY = [...ENGLISH_ONLY_ROUTES, ...DEFAULT_LOCALE_INDEXED_ROUTES];

describe("locale coverage", () => {
  it("lists the app in every locale", async () => {
    const urls = new Set((await sitemap()).map((entry) => entry.url));

    for (const locale of NON_DEFAULT_LOCALES) {
      expect(urls).toContain(`${SITE_URL}/${locale}/game`);
    }
  });

  it("lists each route indexed only in English exactly once, at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const englishUrls = [
      ...LISTED_IN_ENGLISH_ONLY,
      ...EN_LEARN_PAGES.map((page) => `/learn/${page.slug}`),
      ...ARTICLE_SLUGS.map((slug) => `/articles/${slug}`),
    ].map((path) => `${SITE_URL}${path}`);

    for (const url of englishUrls) {
      expect(urls.filter((candidate) => candidate === url)).toHaveLength(1);
    }
  });

  it("lists no locale-prefixed URL of a route indexed only in English, translated or not", async () => {
    const entries = await sitemap();
    const prefixed = new RegExp(
      `^${SITE_URL}/(${NON_DEFAULT_LOCALES.join("|")})(${LISTED_IN_ENGLISH_ONLY.join("|")})(/|$)`,
    );

    expect(prefixed.test(`${SITE_URL}/de/articles/magnus-carlsen`)).toBe(true);
    expect(entries.filter((entry) => prefixed.test(entry.url))).toEqual([]);
  });

  it("gives entries indexed only in English no hreflang alternates", async () => {
    const entries = await sitemap();
    const learn = entries.find((entry) => entry.url === `${SITE_URL}/learn`);
    const articles = entries.find((entry) => entry.url === `${SITE_URL}/articles`);
    const game = entries.find((entry) => entry.url === `${SITE_URL}/game`);

    expect(learn?.alternates).toBeUndefined();
    expect(articles?.alternates).toBeUndefined();
    expect(Object.keys(game?.alternates?.languages ?? {})).toEqual([
      ...LOCALES,
      "x-default",
    ]);
  });
});
