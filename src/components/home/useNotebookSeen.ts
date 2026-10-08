"use client";

import { useEffect, useState } from "react";

export const NOTEBOOK_SEEN_KEY = "memory-chess-lab-notebook-seen";

/** Unreadable storage marks nothing new: the mark could never be stored, so every entry would stay new on every visit. */
function readSeen(): number | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(NOTEBOOK_SEEN_KEY);
    const at = Number(stored);
    return stored !== null && Number.isFinite(at) ? at : null;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * When the player last saw the notebook, or null on a first visit. Read once on mount, then this visit's time is
 * stored, so the entries since the last visit stay marked until the next one.
 */
export function useNotebookSeen(): number | null {
  const [seenBefore] = useState(readSeen);
  useEffect(() => {
    try {
      window.localStorage.setItem(NOTEBOOK_SEEN_KEY, String(Date.now()));
    } catch {
      // Without storage nothing is marked new, which readSeen already returns.
    }
  }, []);
  return seenBefore;
}
