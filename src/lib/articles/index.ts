import adriaanDeGroot from "./entries/adriaan-de-groot";
import juditPolgar from "./entries/judit-polgar";
import magnusCarlsen from "./entries/magnus-carlsen";
import type { Article, ArticleSummary } from "./schema";

export * from "./schema";

const REGISTRY: readonly [Article, ...Article[]] = [magnusCarlsen, adriaanDeGroot, juditPolgar];

export function newestFirst(articles: readonly Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function summarize(article: Article): ArticleSummary {
  const { slug, publishedAt, title, description, person } = article;
  const { src, width, height, alt } = article.photo;
  return { slug, publishedAt, title, description, person, photo: { src, width, height, alt } };
}

export const ARTICLES: readonly Article[] = newestFirst(REGISTRY);

export const ARTICLE_SUMMARIES: readonly ArticleSummary[] = ARTICLES.map(summarize);

export const ARTICLE_SLUGS: readonly string[] = ARTICLES.map((article) => article.slug);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function getNextArticle(slug: string): ArticleSummary | undefined {
  const index = ARTICLE_SLUGS.indexOf(slug);
  if (index < 0 || ARTICLES.length < 2) return undefined;
  return ARTICLE_SUMMARIES[(index + 1) % ARTICLES.length];
}

export const ARTICLES_LAST_UPDATED: string = REGISTRY.reduce(
  (latest, article) => (article.updatedAt > latest ? article.updatedAt : latest),
  REGISTRY[0].updatedAt,
);
