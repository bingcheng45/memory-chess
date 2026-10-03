"use client";

import { useEffect } from "react";
import { sendArticleEvent } from "@/lib/articles/statsClient";
import { viewedStore } from "@/lib/articles/viewedStore";

const PRERENDER_ENDED = "prerenderingchange";

// TypeScript 5.8's DOM types do not carry the Speculation Rules prerender flag.
type PrerenderAwareDocument = Document & { readonly prerendering?: boolean };

export default function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const recordView = () => {
      if (viewedStore.has(slug)) return;

      // Stored before the request leaves, so StrictMode's second effect run finds the slug and sends nothing.
      viewedStore.add(slug);
      void sendArticleEvent(slug, "view");
    };

    if ((document as PrerenderAwareDocument).prerendering !== true) {
      recordView();
      return;
    }

    document.addEventListener(PRERENDER_ENDED, recordView, { once: true });
    return () => document.removeEventListener(PRERENDER_ENDED, recordView);
  }, [slug]);

  return null;
}
