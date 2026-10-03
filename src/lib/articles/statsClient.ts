import { parseArticleCounts, type ArticleCounts, type ArticleEvent } from "@/lib/articles/stats";

const HTTP_OK = 200;

export async function sendArticleEvent(slug: string, event: ArticleEvent): Promise<ArticleCounts | null> {
  try {
    const response = await fetch(`/api/articles/${slug}/stats`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      // A view is sent as the page opens, and the visitor may leave before it lands.
      keepalive: true,
    });
    if (response.status !== HTTP_OK) return null;

    return parseArticleCounts(await response.json());
  } catch {
    return null;
  }
}
