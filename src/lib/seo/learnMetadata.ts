import type { Metadata } from 'next';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

const SITE_URL = 'https://thememorychess.com';

export function buildLearnPageMetadata(slug: string): Metadata {
  const page = getLearnPageBySlug(slug);
  const pageUrl = `${SITE_URL}/learn/${page.slug}`;
  const imageUrl = `${pageUrl}/opengraph-image`;

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
      publishedTime: page.publishedAt,
      modifiedTime: page.updatedAt,
      authors: [page.reviewedBy],
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
    authors: [
      {
        name: page.reviewedBy,
        url: `${SITE_URL}/learn`,
      },
    ],
    other: {
      'article:section': page.goal,
    },
  };
}
