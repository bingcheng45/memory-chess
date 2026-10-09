"use client";

import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

/** Copies only on a press. Where the clipboard is refused, the text element is selected so the player can copy it by hand. */
export function useCopyText(text: string) {
  const textRef = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "failed" && textRef.current) window.getSelection()?.selectAllChildren(textRef.current);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return { state, copy, textRef };
}
