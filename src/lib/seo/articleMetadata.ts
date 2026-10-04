import type { Metadata } from "next";
import { absoluteUrl, ARTICLES_PATH, articlePath } from "@/lib/articles/paths";
import type { Article, ArticleListMeta, ArticleSummary, PortraitPhoto } from "@/lib/articles/schema";
import { localizedPath, localizedUrl } from "@/lib/seo/alternates";
import { robotsFor } from "@/lib/seo/englishOnly";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";

function portraitImage(photo: PortraitPhoto) {
  return {
    url: absoluteUrl(photo.src),
    width: photo.width,
    height: photo.height,
    alt: photo.alt,
  };
}

/**
 * Where a page lives and whether search may index it. The canonical points at
 * the page itself and there are no language alternates, because a translated
 * article is served to readers and never offered to search.
 */
function addressOf(path: string, locale: string) {
  const robots = robotsFor(ARTICLES_PATH, locale);

  return {
    url: localizedUrl(path, locale),
    indexing: {
      alternates: { canonical: localizedPath(path, locale) },
      // An `undefined` robots key would erase the layout's own robots, so the
      // English page carries no key at all.
      ...(robots ? { robots } : {}),
    },
  };
}

export function buildArticleMetadata(article: Article, locale: string): Metadata {
  const { url, indexing } = addressOf(articlePath(article.slug), locale);
  const image = portraitImage(article.photo);

  return {
    title: article.title,
    description: article.description,
    ...indexing,
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [LEARN_AUTHOR.name],
      images: [image],
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.description,
      images: [image.url],
    },
    authors: [{ name: LEARN_AUTHOR.name, url: LEARN_AUTHOR.url }],
  };
}

export function buildArticleListMetadata(
  newest: ArticleSummary,
  locale: string,
  { title, description }: ArticleListMeta,
): Metadata {
  const { url, indexing } = addressOf(ARTICLES_PATH, locale);
  const image = portraitImage(newest.photo);

  return {
    title,
    description,
    ...indexing,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image.url],
    },
  };
}
