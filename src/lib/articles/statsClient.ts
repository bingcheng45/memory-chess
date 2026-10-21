import { parseArticleCounts, toArticleStats, type ArticleCounts, type ArticleEvent, type ArticleStats } from "@/lib/articles/stats";

const HTTP_OK = 200;
const REQUEST_TIMEOUT_MS = 10_000;

export async function sendArticleEvent(slug: string, event: ArticleEvent): Promise<ArticleCounts | null> {
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/articles/${slug}/stats`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
      signal: deadline.signal,
    });
    if (response.status !== HTTP_OK) return null;

    return parseArticleCounts(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchArticleStats(): Promise<ArticleStats | null> {
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/articles/stats", { signal: deadline.signal });
    if (response.status !== HTTP_OK) return null;

    return toArticleStats(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
