import type { MetadataRoute } from 'next';
import { stat } from 'fs/promises';
import path from 'path';
import { LEARN_PAGES } from '@/lib/seo/learnPages';

const SITE_URL = 'https://thememorychess.com';

type SitemapEntryConfig = {
  path: string;
  sourceFile: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

const SITEMAP_ENTRIES: SitemapEntryConfig[] = [
  {
    path: '/',
    sourceFile: 'src/app/page.tsx',
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    path: '/game',
    sourceFile: 'src/app/game/page.tsx',
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/leaderboard',
    sourceFile: 'src/app/leaderboard/page.tsx',
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    path: '/contact-us',
    sourceFile: 'src/app/contact-us/page.tsx',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
];

async function getLastModified(sourceFile: string): Promise<Date> {
  const filePath = path.join(process.cwd(), sourceFile);

  try {
    const fileStats = await stat(filePath);
    return fileStats.mtime;
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = await Promise.all(
    SITEMAP_ENTRIES.map(async (entry) => ({
      url: `${SITE_URL}${entry.path}`,
      lastModified: await getLastModified(entry.sourceFile),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
  );

  const learnLastReviewedDates = LEARN_PAGES.map((page) => new Date(page.lastReviewed));
  const learnHubLastModified = learnLastReviewedDates.reduce(
    (latest, current) => (current > latest ? current : latest),
    new Date('1970-01-01T00:00:00.000Z'),
  );

  const learnEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/learn`,
      lastModified: learnHubLastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...LEARN_PAGES.map((page) => ({
      url: `${SITE_URL}/learn/${page.slug}`,
      lastModified: new Date(page.lastReviewed),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  return [...staticEntries, ...learnEntries];
}
