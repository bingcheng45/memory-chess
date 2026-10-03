import { DEFAULT_LOCALE } from "@/i18n/routing";
import { languageTag } from "@/lib/seo/alternates";
import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/brand";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import { ARTICLE_LIST_COPY } from "./copy";
import { absoluteUrl, ARTICLES_PATH, articlePath } from "./paths";
import type { Article, ArticlePhoto, ArticleSummary } from "./schema";

export type JsonLdGraph = {
  readonly "@context": "https://schema.org";
  readonly "@graph": readonly Record<string, unknown>[];
};

const IN_LANGUAGE = languageTag(DEFAULT_LOCALE);
const LIST_PAGE_ID = `${absoluteUrl(ARTICLES_PATH)}#webpage`;

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

function articleNode(article: Article, url: string): Record<string, unknown> {
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    name: article.title,
    description: article.description,
    image: imageObject(article.photo),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: IN_LANGUAGE,
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

function webPageNode(article: Article, url: string): Record<string, unknown> {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: article.title,
    description: article.description,
    inLanguage: IN_LANGUAGE,
    isPartOf: { "@type": "CollectionPage", "@id": LIST_PAGE_ID },
    mainEntity: { "@id": `${url}#article` },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
}

function breadcrumbNode(article: Article, url: string): Record<string, unknown> {
  const crumbs = [
    { name: ARTICLE_LIST_COPY.heading, item: absoluteUrl(ARTICLES_PATH) },
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

export function buildArticleStructuredData(article: Article): JsonLdGraph {
  const url = absoluteUrl(articlePath(article.slug));

  return {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(article, url),
      webPageNode(article, url),
      breadcrumbNode(article, url),
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}

export function buildArticleListStructuredData(articles: readonly ArticleSummary[]): JsonLdGraph {
  const { title, description } = ARTICLE_LIST_COPY.meta;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": LIST_PAGE_ID,
        url: absoluteUrl(ARTICLES_PATH),
        name: title,
        description,
        inLanguage: IN_LANGUAGE,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: articles.length,
          itemListElement: articles.map((summary, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(articlePath(summary.slug)),
            name: summary.title,
          })),
        },
      },
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}
