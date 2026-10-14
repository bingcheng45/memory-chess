"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyFeedback = "idle" | "copied" | "failed";

const CONFIRMATION_MS = 2000;

/** What one copy button shows: "copied" for a couple of seconds after each success, which a press in the meantime restarts. */
export function useCopyFeedback() {
  const [state, setState] = useState<CopyFeedback>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const settle = useCallback((copied: boolean) => {
    clearTimeout(timer.current);
    setState(copied ? "copied" : "failed");
    if (copied) timer.current = setTimeout(() => setState("idle"), CONFIRMATION_MS);
  }, []);

  return [state, settle] as const;
}
