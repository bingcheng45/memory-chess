import type { Metadata } from 'next';
import { LEARN_AUTHOR, type LearnPageContent } from '@/lib/seo/learn/schema';

const SITE_URL = 'https://thememorychess.com';

/** Learn is English-only: one bare URL, its own canonical, no alternates. */
export function buildLearnPageMetadata(page: LearnPageContent): Metadata {
  const articlePath = `/learn/${page.slug}`;
  const pageUrl = `${SITE_URL}${articlePath}`;
  const imageUrl = `${pageUrl}/opengraph-image`;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: articlePath },
    openGraph: {
      title: page.title,
      description: page.description,
      url: pageUrl,
      type: 'article',
      publishedTime: page.publishedAt,
      modifiedTime: page.updatedAt,
      authors: [LEARN_AUTHOR.name],
      tags: [page.primaryKeyword, ...page.secondaryKeywords],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [imageUrl],
    },
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    authors: [{ name: LEARN_AUTHOR.name, url: LEARN_AUTHOR.url }],
    other: {
      'article:section': page.goal,
    },
  };
}
