import type { MetadataRoute } from "next";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import { LEARN_SLUGS, UPDATED_AT, learnLocales } from "@/lib/seo/learn";
import { LOCALES } from "@/i18n/routing";
import { localizedPath } from "@/lib/seo/alternates";

const SITE_URL = "https://thememorychess.com";

type SitemapEntryConfig = {
  path: string;
  /**
   * When this page's content last meaningfully changed, as an ISO date.
   *
   * Stated rather than derived. It was read from the source file's mtime,
   * which is right on a working copy and wrong everywhere it matters: a
   * deployment builds from a fresh clone, and a checkout stamps every file
   * with the time it was written, so every page claimed to have changed at
   * the moment of the deploy -- and again at the next one, whether or not
   * anything about it had changed. A date that always says "just now" is one
   * a crawler learns to disregard.
   *
   * A file's own history is not much better: it moves for a renamed variable
   * or a padding class as readily as for a rewrite. Nobody but the author
   * knows which edits a reader would care about, so the author says.
   *
   * Update these when the page's content changes, the same discipline the
   * changelog and the learn articles already keep. A date left too long is a
   * page crawled a little less often; there is no other cost, and none of the
   * dishonesty of a date that moves on its own.
   */
  lastModified: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const SITEMAP_ENTRIES: SitemapEntryConfig[] = [
  {
    path: "/",
    lastModified: "2026-08-28T00:00:00.000Z",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/game",
    lastModified: "2026-08-28T00:00:00.000Z",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/leaderboard",
    lastModified: "2026-08-28T00:00:00.000Z",
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    path: "/contact-us",
    lastModified: "2026-08-28T00:00:00.000Z",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/changelog",
    lastModified: LATEST_CHANGELOG_ENTRY.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/privacy",
    lastModified: "2026-08-28T00:00:00.000Z",
    changeFrequency: "yearly",
    priority: 0.4,
  },
];

/**
 * The privacy policy is still English-only, so it is listed once rather than
 * per locale. Announcing 24 URLs that all serve the same English text would be
 * a duplicate-content signal.
 */
const ENGLISH_ONLY_PATHS = new Set(["/privacy"]);

/** hreflang block for one route across the locales that genuinely differ. */
function alternatesFor(routePath: string, locales: readonly string[]) {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [
        locale,
        `${SITE_URL}${localizedPath(routePath, locale)}`,
      ]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = SITEMAP_ENTRIES.flatMap(
    (entry) => {
      const locales = ENGLISH_ONLY_PATHS.has(entry.path) ? ["en"] : LOCALES;

      return locales.map((locale) => ({
        url: `${SITE_URL}${localizedPath(entry.path, locale)}`,
        lastModified: new Date(entry.lastModified),
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: alternatesFor(entry.path, locales),
      }));
    },
  );

  // Learn covers only the locales with a real translated article set. The rest
  // fall back to English at runtime and must not appear as separate URLs.
  const learnTargets = learnLocales();
  const learnUpdated = new Date(UPDATED_AT);

  const learnHubEntries: MetadataRoute.Sitemap = learnTargets.map((locale) => ({
    url: `${SITE_URL}${localizedPath("/learn", locale)}`,
    lastModified: learnUpdated,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    alternates: alternatesFor("/learn", learnTargets),
  }));

  const learnArticleEntries: MetadataRoute.Sitemap = LEARN_SLUGS.flatMap(
    (slug) =>
      learnTargets.map((locale) => ({
        url: `${SITE_URL}${localizedPath(`/learn/${slug}`, locale)}`,
        lastModified: learnUpdated,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: alternatesFor(`/learn/${slug}`, learnTargets),
      })),
  );

  return [...staticEntries, ...learnHubEntries, ...learnArticleEntries];
}
