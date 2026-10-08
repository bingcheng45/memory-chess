"use client";

import { useState } from "react";
import { useFirstSight } from "./useFirstSight";

export const NOTEBOOK_SEEN_KEY = "memory-chess-lab-notebook-seen";

/** When storage refuses the write, the visit is kept here for the rest of the session. */
let seenThisSession: number | null = null;

/** Unreadable storage marks nothing new: the mark could never be stored, so every entry would stay new on every visit. */
function readSeen(): number | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(NOTEBOOK_SEEN_KEY);
    const at = Number(stored);
    return stored !== null && Number.isFinite(at) ? Math.max(at, seenThisSession ?? at) : seenThisSession;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function storeSeen() {
  const now = Date.now();
  try {
    window.localStorage.setItem(NOTEBOOK_SEEN_KEY, String(now));
  } catch {
    seenThisSession = now;
  }
}

/**
 * When the player last saw their notebook entries, or null on a first visit, read once on mount. This visit is stored
 * only once the entries were on screen, through the returned ref, so entries since the last visit stay marked until
 * the player has seen them.
 */
export function useNotebookSeen(): { seenBefore: number | null; ref: (node: HTMLElement | null) => void } {
  const [seenBefore] = useState(readSeen);
  const ref = useFirstSight<HTMLElement>(storeSeen);
  return { seenBefore, ref };
}
