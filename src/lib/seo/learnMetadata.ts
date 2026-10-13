import type { Metadata } from 'next';
import { LEARN_AUTHOR, type LearnPage } from '@/lib/seo/learn';

const SITE_URL = 'https://thememorychess.com';

/** Learn is English-only: one bare URL, its own canonical, no alternates. */
export function buildLearnPageMetadata(page: LearnPage): Metadata {
  const { slug, title, description, publishedAt, updatedAt, keywords } = page.meta;
  const articlePath = `/learn/${slug}`;
  const pageUrl = `${SITE_URL}${articlePath}`;
  const imageUrl = `${pageUrl}/opengraph-image`;
  const tags = [keywords.primary, ...keywords.secondary];

  return {
    title,
    description,
    alternates: { canonical: articlePath },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: updatedAt,
      authors: [LEARN_AUTHOR.name],
      tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    keywords: tags,
    authors: [{ name: LEARN_AUTHOR.name, url: LEARN_AUTHOR.url }],
    other: {
      'article:section': page.group.label,
    },
  };
}
