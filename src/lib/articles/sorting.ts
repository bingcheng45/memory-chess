import { countsFor, hasCounts, type ArticleCounts, type ArticleStats } from "@/lib/articles/stats";

export const SORT_KEYS = ["newest", "views", "likes"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = "newest";

const MIN_ARTICLES_TO_SORT = 2;
const NO_COUNTS: ArticleCounts = { views: 0, likes: 0 };

const ORDER_AMONG_NEWEST_FIRST: Record<SortKey, (a: ArticleCounts, b: ArticleCounts) => number> = {
  newest: () => 0,
  views: (a, b) => b.views - a.views,
  likes: (a, b) => b.likes - a.likes,
};

type WithSlug = { readonly slug: string };

export function parseSortKey(raw: string | null): SortKey {
  return SORT_KEYS.find((key) => key === raw) ?? DEFAULT_SORT;
}

export function sortArticles<T extends WithSlug>(
  newestFirst: readonly T[],
  stats: ArticleStats,
  sort: SortKey,
): readonly T[] {
  const order = ORDER_AMONG_NEWEST_FIRST[sort];
  const countsOf = (article: T) => countsFor(stats, article.slug) ?? NO_COUNTS;

  return [...newestFirst].sort((a, b) => order(countsOf(a), countsOf(b)));
}

export function hasCountsToSortBy(articles: readonly WithSlug[], stats: ArticleStats): boolean {
  if (articles.length < MIN_ARTICLES_TO_SORT) return false;

  return articles.some((article) => hasCounts(countsFor(stats, article.slug)));
}
