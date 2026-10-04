import adriaanDeGroot from "./entries/adriaan-de-groot";
import juditPolgar from "./entries/judit-polgar";
import magnusCarlsen from "./entries/magnus-carlsen";
import type { Article } from "./schema";

const REGISTRY: readonly [Article, ...Article[]] = [magnusCarlsen, adriaanDeGroot, juditPolgar];

export function newestFirst(articles: readonly Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** The English entries, newest first. English is the source every translation is made from. */
export const ARTICLES: readonly Article[] = newestFirst(REGISTRY);

export const ARTICLE_SLUGS: readonly string[] = ARTICLES.map((article) => article.slug);

export const ARTICLES_LAST_UPDATED: string = REGISTRY.reduce(
  (latest, article) => (article.updatedAt > latest ? article.updatedAt : latest),
  REGISTRY[0].updatedAt,
);
