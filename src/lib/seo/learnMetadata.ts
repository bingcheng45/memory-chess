import type { Metadata } from 'next';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

const SITE_URL = 'https://thememorychess.com';

export function buildLearnPageMetadata(slug: string): Metadata {
  const page = getLearnPageBySlug(slug);
  const pageUrl = `${SITE_URL}/learn/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/learn/${page.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: pageUrl,
      type: 'article',
    },
    twitter: {
      title: page.title,
      description: page.description,
    },
  };
}
