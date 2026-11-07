import { useEffect, useState } from "react";
import type { ArticleStats } from "@/lib/articles/stats";
import { fetchArticleStats } from "@/lib/articles/statsClient";

/**
 * The page carries the counts from its build, which paint first and sort the list before hydration. The current counts
 * come from a CDN-cached read after hydration, so the page itself never has to be regenerated to stay fresh.
 */
export function useLiveArticleStats(built: ArticleStats): ArticleStats {
  const [live, setLive] = useState<ArticleStats | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void fetchArticleStats().then((stats) => {
      if (isCurrent && stats !== null) setLive(stats);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  return live === null ? built : { ...built, ...live };
}
