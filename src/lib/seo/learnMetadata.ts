import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { localizedPath, localizedUrl } from '@/lib/seo/alternates';
import { LEARN_AUTHOR, type LearnPage } from '@/lib/seo/learn';
import { indexedLocalesOf, robotsFor } from '@/lib/seo/englishOnly';
import { guidePath } from '@/lib/seo/learn/links';

export function buildLearnPageMetadata(page: LearnPage, locale: string = DEFAULT_LOCALE): Metadata {
  const { slug, description, publishedAt, updatedAt, keywords } = page.meta;
  const title = locale === DEFAULT_LOCALE ? (page.meta.searchTitle ?? page.meta.title) : page.meta.title;
  const path = guidePath(slug);
  const locales = indexedLocalesOf(path);
  const robots = robotsFor(path, locale);
  const imageUrl = `${localizedUrl(path, DEFAULT_LOCALE)}/opengraph-image`;
  const tags = [keywords.primary, ...keywords.secondary];
  const languages =
    locales.length > 1 && locales.includes(locale)
      ? { languages: { ...Object.fromEntries(locales.map((served) => [served, localizedPath(path, served)])), 'x-default': path } }
      : {};

  return {
    title,
    description,
    alternates: { canonical: localizedPath(path, locale), ...languages },
    ...(robots ? { robots } : {}),
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
