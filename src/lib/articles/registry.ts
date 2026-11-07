import adriaanDeGroot from "./entries/adriaan-de-groot";
import dominicObrien from "./entries/dominic-obrien";
import garryKasparov from "./entries/garry-kasparov";
import juditPolgar from "./entries/judit-polgar";
import magnusCarlsen from "./entries/magnus-carlsen";
import miguelNajdorf from "./entries/miguel-najdorf";
import type { Article } from "./schema";

const REGISTRY: readonly [Article, ...Article[]] = [magnusCarlsen, adriaanDeGroot, juditPolgar, miguelNajdorf, garryKasparov, dominicObrien];

export function newestFirst(articles: readonly Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const ARTICLES: readonly Article[] = newestFirst(REGISTRY);

export const ARTICLE_SLUGS: readonly string[] = ARTICLES.map((article) => article.slug);

export const ARTICLES_LAST_UPDATED: string = REGISTRY.reduce(
  (latest, article) => (article.updatedAt > latest ? article.updatedAt : latest),
  REGISTRY[0].updatedAt,
);
