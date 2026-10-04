import type { CSSProperties } from "react";
import { SORT_PARAM } from "@/components/articles/listAddress";
import { RANKED_SORTS, rankArticles } from "@/lib/articles/sorting";
import type { ArticleStats } from "@/lib/articles/stats";

const SORTED_FIRST_PAINT_ATTRIBUTE = "data-article-sort";

export function rankStyles(
  newestFirst: readonly { readonly slug: string }[],
  stats: ArticleStats,
): ReadonlyMap<string, CSSProperties> {
  return new Map(
    Array.from(rankArticles(newestFirst, stats), ([slug, ranks]) => [
      slug,
      Object.fromEntries(RANKED_SORTS.map((sort) => [`--rank-${sort}`, ranks[sort]])),
    ]),
  );
}

// The server HTML is always newest first. On a direct load of ?sort=, this
// runs before the list is parsed and marks <html>, and articleList.css turns
// the mark into each card's rank, so the first paint is already in the order
// React will hydrate into. It ships as an inline script, so it has no imports
// and only syntax every browser parses.
export function sortedFirstPaintScript(): string {
  return `(function () {
  try {
    var sort = new URLSearchParams(location.search).get(${JSON.stringify(SORT_PARAM)});
    if (${JSON.stringify(RANKED_SORTS)}.indexOf(sort) !== -1) {
      document.documentElement.setAttribute(${JSON.stringify(SORTED_FIRST_PAINT_ATTRIBUTE)}, sort);
    }
  } catch (error) {}
})();`;
}

export function clearSortedFirstPaint(): void {
  document.documentElement.removeAttribute(SORTED_FIRST_PAINT_ATTRIBUTE);
}
