import type { Metadata } from 'next';
import { hasLearnTranslation, learnContentLocale, learnLocales } from '@/lib/seo/learn';
import type { LearnPageContent } from '@/lib/seo/learn/schema';
import { localizedPath } from '@/lib/seo/alternates';
import { DEFAULT_LOCALE } from '@/i18n/routing';

const SITE_URL = 'https://thememorychess.com';

/**
 * hreflang for a Learn article covers only the locales that actually have a
 * translated article set -- see TRANSLATED_LEARN_LOCALES in ./learn. A locale
 * that falls back to English canonicalises to the English URL instead of
 * claiming a translation that does not exist.
 */
function buildLearnAlternates(slug: string, locale: string): Metadata['alternates'] {
  const path = `/learn/${slug}`;
  const translated = learnLocales();

  if (!hasLearnTranslation(locale)) {
    return { canonical: localizedPath(path, DEFAULT_LOCALE) };
  }

  const languages = Object.fromEntries(
    translated.map((l) => [l, localizedPath(path, l)]),
  ) as Record<string, string>;

  return {
    canonical: localizedPath(path, locale),
    languages: {
      ...languages,
      'x-default': localizedPath(path, DEFAULT_LOCALE),
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
    alternates: buildLearnAlternates(page.slug, locale),
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
