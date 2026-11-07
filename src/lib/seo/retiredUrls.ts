import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { indexedLocalesOf } from "@/lib/seo/englishOnly";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";
import { RETIRED_LEARN_SLUGS } from "@/lib/seo/learn/retired";
import { localizedPath } from "@/lib/seo/alternates";

const SITE_URL = "https://thememorychess.com";

export const RETIRED_SITEMAP_PATH = "/retired-sitemap.xml";

/**
 * The day these URLs stopped being indexable pages: every locale-prefixed
 * /learn, /changelog and /leaderboard URL has answered a 308 to English or
 * served noindex since then (commits 103d2e3e and 18f00b3b).
 */
export const RETIRED_URLS_CHANGED_AT = "2026-09-15";

/** Google's last crawl of the translated guides. A guide published after it was never indexed in translation. */
const LAST_CRAWLED_AT = "2026-08-29";

const RETIRED_ROUTES: readonly string[] = [
  "/learn",
  ...EN_LEARN_PAGES.filter(({ meta }) => meta.publishedAt < LAST_CRAWLED_AT).map(({ meta }) => `/learn/${meta.slug}`),
  ...Object.keys(RETIRED_LEARN_SLUGS).map((slug) => `/learn/${slug}`),
  "/changelog",
  "/leaderboard",
];

/**
 * Locale-prefixed URLs that Google indexed in August 2026 and has not crawled
 * since. On 2026-10-28 Search Console listed 370 indexed pages against 103 in
 * the sitemap, and 309 of them were translated /learn pages last crawled on
 * 29 August. Each now redirects or is noindex, but nothing tells Google to
 * look again: the main sitemap no longer lists them.
 *
 * This sitemap lists them with a lastmod after that crawl, so Google fetches
 * each once and drops it. Remove it, and its robots.txt line, once Search
 * Console's indexed count is close to the main sitemap's.
 */
export function retiredUrls(): readonly string[] {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).flatMap((locale) =>
    RETIRED_ROUTES.filter((route) => !indexedLocalesOf(route).includes(locale)).map(
      (route) => `${SITE_URL}${localizedPath(route, locale)}`,
    ),
  );
}

export function retiredSitemapXml(): string {
  const entries = retiredUrls()
    .map((url) => `<url><loc>${url}</loc><lastmod>${RETIRED_URLS_CHANGED_AT}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
