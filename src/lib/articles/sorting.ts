import { countsFor, hasCounts, type ArticleCounts, type ArticleStats } from "@/lib/articles/stats";

export const SORT_KEYS = ["newest", "views", "likes"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT = "newest" satisfies SortKey;

export type RankedSort = Exclude<SortKey, typeof DEFAULT_SORT>;

export const RANKED_SORTS = SORT_KEYS.filter((sort): sort is RankedSort => sort !== DEFAULT_SORT);

export type SortRanks = Readonly<Record<RankedSort, number>>;

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

export function rankArticles(newestFirst: readonly WithSlug[], stats: ArticleStats): ReadonlyMap<string, SortRanks> {
  const placed = RANKED_SORTS.map(
    (sort) => [sort, sortArticles(newestFirst, stats, sort).map((article) => article.slug)] as const,
  );
  const ranksOf = (slug: string) =>
    Object.fromEntries(placed.map(([sort, slugs]) => [sort, slugs.indexOf(slug)])) as SortRanks;

  return new Map(newestFirst.map(({ slug }) => [slug, ranksOf(slug)]));
}

export function hasCountsToSortBy(articles: readonly WithSlug[], stats: ArticleStats): boolean {
  if (articles.length < MIN_ARTICLES_TO_SORT) return false;

  return articles.some((article) => hasCounts(countsFor(stats, article.slug)));
}
