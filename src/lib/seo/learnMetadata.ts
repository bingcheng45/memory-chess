import type { Metadata } from 'next';
import {
  hasLearnTranslation,
  isReviewedLearnLocale,
  learnContentLocale,
  reviewedLearnLocales,
} from '@/lib/seo/learn';
import type { LearnPageContent } from '@/lib/seo/learn/schema';
import { localizedPath } from '@/lib/seo/alternates';
import { DEFAULT_LOCALE } from '@/i18n/routing';

const SITE_URL = 'https://thememorychess.com';

/**
 * Canonical, hreflang and robots for any Learn route, the hub included.
 *
 * hreflang lists only reviewed locales, so it never points a search engine at
 * a page that asks not to be indexed. An unreviewed translation canonicalises
 * to itself and is noindexed rather than pointed at English: it is a real
 * translation, just not one we vouch for. A locale with no translation at all
 * still canonicalises to the English URL.
 */
export function buildLearnIndexing(
  path: string,
  locale: string,
): Pick<Metadata, 'alternates' | 'robots'> {
  if (!hasLearnTranslation(locale)) {
    return { alternates: { canonical: localizedPath(path, DEFAULT_LOCALE) } };
  }

  if (!isReviewedLearnLocale(locale)) {
    return {
      alternates: { canonical: localizedPath(path, locale) },
      robots: { index: false, follow: true },
    };
  }

  const reviewed = reviewedLearnLocales();
  return {
    alternates: {
      canonical: localizedPath(path, locale),
      ...(reviewed.length > 1 && {
        languages: {
          ...Object.fromEntries(reviewed.map((l) => [l, localizedPath(path, l)])),
          'x-default': localizedPath(path, DEFAULT_LOCALE),
        },
      }),
    },
  };
}

/**
 * Takes an already-resolved page rather than fetching one, so this stays a pure
 * function of its inputs -- no next-intl request context, and unit-testable.
 */
export function buildLearnPageMetadata(
  page: LearnPageContent,
  locale: string,
): Metadata {
  // The social card route lives under [locale] and renders the translated
  // title, so it has to carry the same prefix the canonical does -- otherwise
  // /de/learn/... advertises the English card. An untranslated locale serves
  // English prose and canonicalises to English, so its card is English too.
  const contentLocale = learnContentLocale(locale);
  const articlePath = localizedPath(`/learn/${page.slug}`, contentLocale);
  const pageUrl = `${SITE_URL}${articlePath}`;
  const imageUrl = `${SITE_URL}${articlePath}/opengraph-image`;

  return {
    title: page.title,
    description: page.description,
    ...buildLearnIndexing(`/learn/${page.slug}`, locale),
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
        url: `${SITE_URL}/about`,
      },
    ],
    other: {
      'article:section': page.goal,
    },
  };
}
