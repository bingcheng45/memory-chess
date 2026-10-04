import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/brand";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import { absoluteUrl, ARTICLES_PATH, articlePath } from "./paths";
import type { Article, ArticleListMeta, ArticlePhoto, ArticleSummary } from "./schema";

export type JsonLdGraph = {
  readonly "@context": "https://schema.org";
  readonly "@graph": readonly Record<string, unknown>[];
};

type Edition = {
  readonly url: string;
  readonly listUrl: string;
  readonly inLanguage: string;
};

function editionOf(path: string, locale: string): Edition {
  return {
    url: localizedUrl(path, locale),
    listUrl: localizedUrl(ARTICLES_PATH, locale),
    inLanguage: languageTag(locale),
  };
}

function listPageId({ listUrl }: Edition): string {
  return `${listUrl}#webpage`;
}

function imageObject(photo: ArticlePhoto): Record<string, unknown> {
  return {
    "@type": "ImageObject",
    url: absoluteUrl(photo.src),
    width: photo.width,
    height: photo.height,
    creditText: photo.author,
    acquireLicensePage: photo.sourceUrl,
    ...(photo.licenseUrl === null ? {} : { license: photo.licenseUrl }),
  };
}

function articleNode(article: Article, { url, inLanguage }: Edition): Record<string, unknown> {
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    name: article.title,
    description: article.description,
    image: imageObject(article.photo),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage,
    isAccessibleForFree: true,
    about: {
      "@type": "Person",
      name: article.person.name,
      description: article.person.role,
    },
    author: {
      "@type": "Person",
      "@id": LEARN_AUTHOR.id,
      name: LEARN_AUTHOR.name,
      url: LEARN_AUTHOR.url,
    },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: { "@id": `${url}#webpage` },
  };
}

function webPageNode(article: Article, edition: Edition): Record<string, unknown> {
  const { url, inLanguage } = edition;

  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: article.title,
    description: article.description,
    inLanguage,
    isPartOf: { "@type": "CollectionPage", "@id": listPageId(edition) },
    mainEntity: { "@id": `${url}#article` },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
}

function breadcrumbNode(article: Article, { url, listUrl }: Edition, listName: string): Record<string, unknown> {
  const crumbs = [
    { name: listName, item: listUrl },
    { name: article.title, item: url },
  ];

  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...crumb,
    })),
  };
}

export function buildArticleStructuredData(
  article: Article,
  locale: string,
  listName: string,
): JsonLdGraph {
  const edition = editionOf(articlePath(article.slug), locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(article, edition),
      webPageNode(article, edition),
      breadcrumbNode(article, edition, listName),
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}

export function buildArticleListStructuredData(
  articles: readonly ArticleSummary[],
  locale: string,
  { title, description }: ArticleListMeta,
): JsonLdGraph {
  const edition = editionOf(ARTICLES_PATH, locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": listPageId(edition),
        url: edition.url,
        name: title,
        description,
        inLanguage: edition.inLanguage,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: articles.length,
          itemListElement: articles.map((summary, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: localizedUrl(articlePath(summary.slug), locale),
            name: summary.title,
          })),
        },
      },
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}
