import type { CSSProperties } from "react";
import { SORT_PARAM } from "@/components/articles/listAddress";
import { RANKED_SORTS, rankArticles } from "@/lib/articles/sorting";
import type { ArticleStats } from "@/lib/articles/stats";

const SORTED_FIRST_PAINT_ATTRIBUTE = "data-first-paint-sort";

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

export function sortedFirstPaintInlineScript(): string {
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
