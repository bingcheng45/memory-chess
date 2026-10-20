import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { localizedPath, localizedUrl } from '@/lib/seo/alternates';
import { LEARN_AUTHOR, type LearnPage } from '@/lib/seo/learn';
import { guideLocalesOf, guidePath } from '@/lib/seo/learn/links';

/**
 * A guide is canonical to its own URL in each locale it is served in. A translated guide lists the English guide and
 * every translation as alternates, and an English-only guide lists none.
 */
export function buildLearnPageMetadata(page: LearnPage, locale: string = DEFAULT_LOCALE): Metadata {
  const { slug, title, description, publishedAt, updatedAt, keywords } = page.meta;
  const path = guidePath(slug);
  const locales = guideLocalesOf(slug);
  const imageUrl = `${localizedUrl(path, DEFAULT_LOCALE)}/opengraph-image`;
  const tags = [keywords.primary, ...keywords.secondary];
  const languages =
    locales.length > 1
      ? { languages: { ...Object.fromEntries(locales.map((served) => [served, localizedPath(path, served)])), 'x-default': path } }
      : {};

  return {
    title,
    description,
    alternates: { canonical: localizedPath(path, locale), ...languages },
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
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
