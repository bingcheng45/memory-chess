"use client";

import { useEffect } from "react";
import { sendArticleEvent } from "@/lib/articles/statsClient";
import { viewedStore } from "@/lib/articles/viewedStore";

export default function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (viewedStore.has(slug)) return;

    // Stored before the request leaves, so StrictMode's second effect run finds the slug and sends nothing.
    viewedStore.add(slug);
    void sendArticleEvent(slug, "view");
  }, [slug]);

  return null;
}
