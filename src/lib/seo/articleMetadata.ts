import type { Metadata } from "next";
import { ARTICLE_LIST_COPY } from "@/lib/articles/copy";
import { absoluteUrl, ARTICLES_PATH, articlePath } from "@/lib/articles/paths";
import type { Article, ArticleSummary, PortraitPhoto } from "@/lib/articles/schema";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";

function portraitImage(photo: PortraitPhoto) {
  return {
    url: absoluteUrl(photo.src),
    width: photo.width,
    height: photo.height,
    alt: photo.alt,
  };
}

export function buildArticleMetadata(article: Article): Metadata {
  const path = articlePath(article.slug);
  const image = portraitImage(article.photo);

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: absoluteUrl(path),
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

export function buildArticleListMetadata(newest: ArticleSummary): Metadata {
  const { title, description } = ARTICLE_LIST_COPY.meta;
  const image = portraitImage(newest.photo);

  return {
    title,
    description,
    alternates: { canonical: ARTICLES_PATH },
    openGraph: {
      type: "website",
      url: absoluteUrl(ARTICLES_PATH),
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
