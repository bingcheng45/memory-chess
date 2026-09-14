import sitemap from "@/app/sitemap";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/routing";
import { ENGLISH_ONLY_ROUTES } from "@/lib/seo/englishOnly";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";

const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);
const SITE_URL = "https://thememorychess.com";

describe("locale coverage", () => {
  it("lists the app in every locale", async () => {
    const urls = new Set((await sitemap()).map((entry) => entry.url));

    for (const locale of NON_DEFAULT_LOCALES) {
      expect(urls).toContain(`${SITE_URL}/${locale}/game`);
    }
  });

  it("lists each English-only route exactly once, at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const englishOnlyUrls = [
      ...ENGLISH_ONLY_ROUTES,
      ...EN_LEARN_PAGES.map((page) => `/learn/${page.slug}`),
    ].map((path) => `${SITE_URL}${path}`);

    for (const url of englishOnlyUrls) {
      expect(urls.filter((candidate) => candidate === url)).toHaveLength(1);
    }
  });

  it("lists no locale-prefixed English-only URL", async () => {
    const entries = await sitemap();
    const prefixed = new RegExp(
      `^${SITE_URL}/(${NON_DEFAULT_LOCALES.join("|")})(${ENGLISH_ONLY_ROUTES.join("|")})(/|$)`,
    );

    expect(entries.filter((entry) => prefixed.test(entry.url))).toEqual([]);
  });

  it("gives English-only entries no hreflang alternates", async () => {
    const entries = await sitemap();
    const learn = entries.find((entry) => entry.url === `${SITE_URL}/learn`);
    const game = entries.find((entry) => entry.url === `${SITE_URL}/game`);

    expect(learn?.alternates).toBeUndefined();
    expect(Object.keys(game?.alternates?.languages ?? {})).toHaveLength(
      LOCALES.length,
    );
  });
});
