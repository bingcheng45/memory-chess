import type { MetadataRoute } from "next";
import { stat } from "fs/promises";
import path from "path";
import { LEARN_SLUGS, UPDATED_AT, learnLocales } from "@/lib/seo/learn";
import { LOCALES } from "@/i18n/routing";
import { localizedPath } from "@/lib/seo/alternates";

const SITE_URL = "https://thememorychess.com";

type SitemapEntryConfig = {
  path: string;
  sourceFile: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const SITEMAP_ENTRIES: SitemapEntryConfig[] = [
  {
    path: "/",
    sourceFile: "src/app/[locale]/page.tsx",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/game",
    sourceFile: "src/app/[locale]/game/page.tsx",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/leaderboard",
    sourceFile: "src/app/[locale]/leaderboard/page.tsx",
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    path: "/contact-us",
    sourceFile: "src/app/[locale]/contact-us/page.tsx",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/changelog",
    sourceFile: "src/lib/changelog/index.ts",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/privacy",
    sourceFile: "src/app/[locale]/privacy/page.tsx",
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

async function getLastModified(sourceFile: string): Promise<Date> {
  const filePath = path.join(process.cwd(), sourceFile);

  try {
    const fileStats = await stat(filePath);
    return fileStats.mtime;
  } catch {
    return new Date();
  }
}

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = (
    await Promise.all(
      SITEMAP_ENTRIES.map(async (entry) => {
        const lastModified = await getLastModified(entry.sourceFile);
        const locales = ENGLISH_ONLY_PATHS.has(entry.path) ? ["en"] : LOCALES;

        return locales.map((locale) => ({
          url: `${SITE_URL}${localizedPath(entry.path, locale)}`,
          lastModified,
          changeFrequency: entry.changeFrequency,
          priority: entry.priority,
          alternates: alternatesFor(entry.path, locales),
        }));
      }),
    )
  ).flat();

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
