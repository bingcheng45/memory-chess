import {
  NO_ARTICLE_STATS,
  parseArticleCounts,
  toArticleStats,
  type ArticleCounts,
  type ArticleEvent,
  type ArticleStats,
} from "@/lib/articles/stats";
import { supabase } from "@/lib/supabase";

const ARTICLE_STATS_TABLE = "article_stats";
const ARTICLE_STATS_COLUMNS = "slug,views,likes";
const SLUG_COLUMN = "slug";
const RECORD_ARTICLE_EVENT_FUNCTION = "record_article_event";
const SUPABASE_TIMEOUT_MS = 3000;

/**
 * `cause` is for the operator reading logs, never for the reader of the page.
 */
export type RecordArticleEventResult =
  | { status: "recorded"; counts: ArticleCounts }
  | { status: "unavailable"; cause: unknown }
  | { status: "failed"; cause: unknown };

export async function getArticleStats(slugs: readonly string[]): Promise<ArticleStats> {
  if (slugs.length === 0 || !supabase) return NO_ARTICLE_STATS;

  try {
    const { data, error } = await supabase
      .from(ARTICLE_STATS_TABLE)
      .select(ARTICLE_STATS_COLUMNS)
      .in(SLUG_COLUMN, slugs)
      .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

    if (error) {
      console.error("Article stats read failed:", error);
      return NO_ARTICLE_STATS;
    }

    return toArticleStats(data);
  } catch (cause) {
    console.error("Article stats read failed:", cause);
    return NO_ARTICLE_STATS;
  }
}

export async function recordArticleEvent(
  slug: string,
  event: ArticleEvent,
): Promise<RecordArticleEventResult> {
  if (!supabase) {
    return { status: "unavailable", cause: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .rpc(RECORD_ARTICLE_EVENT_FUNCTION, { p_slug: slug, p_event: event })
      .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

    if (error) {
      return { status: "failed", cause: error };
    }

    const counts = parseArticleCounts(Array.isArray(data) ? data[0] : data);
    if (counts === null) {
      return {
        status: "failed",
        cause: { message: `${RECORD_ARTICLE_EVENT_FUNCTION} answered without counts`, data },
      };
    }

    return { status: "recorded", counts };
  } catch (cause) {
    return { status: "failed", cause };
  }
}
