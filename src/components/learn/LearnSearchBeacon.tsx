"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type { SearchOutcome } from "@/lib/seo/learn/search";

interface LearnSearchBeaconProps {
  readonly queryLength: number;
  readonly results: number;
  readonly top: string;
  readonly outcome: SearchOutcome;
}

/** Reports the server-rendered search once, and each result opened from it by its `data-search-rank` link. */
export default function LearnSearchBeacon({ queryLength, results, top, outcome }: LearnSearchBeaconProps) {
  useEffect(() => {
    trackEvent({ name: "learn_search", params: { query_length: queryLength, results, top, outcome, surface: "server" } });
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-search-rank]") : null;
      if (!link) return;
      trackEvent({
        name: "learn_search_select",
        params: {
          slug: link.dataset.searchSlug ?? "",
          rank: Number(link.dataset.searchRank),
          matched_question: link.dataset.searchMatched === "true",
          surface: "server",
        },
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [queryLength, results, top, outcome]);

  return null;
}
