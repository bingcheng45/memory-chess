export const ARTICLE_EVENTS = ["view", "like", "unlike"] as const;

export type ArticleEvent = (typeof ARTICLE_EVENTS)[number];

export type ArticleCounts = {
  readonly views: number;
  readonly likes: number;
};

export type ArticleStats = Readonly<Partial<Record<string, ArticleCounts>>>;

export const NO_ARTICLE_STATS: ArticleStats = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function parseArticleEvent(body: unknown): ArticleEvent | null {
  if (!isRecord(body)) return null;
  return ARTICLE_EVENTS.find((event) => event === body.event) ?? null;
}

export function parseArticleCounts(row: unknown): ArticleCounts | null {
  if (!isRecord(row) || !isCount(row.views) || !isCount(row.likes)) return null;
  return { views: row.views, likes: row.likes };
}

export function toArticleStats(rows: unknown): ArticleStats {
  if (!Array.isArray(rows)) return NO_ARTICLE_STATS;

  return Object.fromEntries(
    rows.flatMap((row) => {
      const counts = parseArticleCounts(row);
      return counts !== null && isRecord(row) && typeof row.slug === "string"
        ? [[row.slug, counts] as const]
        : [];
    }),
  );
}

export function countsFor(stats: ArticleStats, slug: string): ArticleCounts | undefined {
  return Object.prototype.hasOwnProperty.call(stats, slug) ? stats[slug] : undefined;
}
