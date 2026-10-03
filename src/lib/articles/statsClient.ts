import { parseArticleCounts, type ArticleCounts, type ArticleEvent } from "@/lib/articles/stats";

const HTTP_OK = 200;
const REQUEST_TIMEOUT_MS = 10_000;

export async function sendArticleEvent(slug: string, event: ArticleEvent): Promise<ArticleCounts | null> {
  // The like button ignores presses while a request is out, so a request that never settles would leave it dead.
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/articles/${slug}/stats`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      // A view is sent as the page opens, and the visitor may leave before it lands.
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
