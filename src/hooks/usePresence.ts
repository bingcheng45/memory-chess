import { useEffect, useState } from "react";

/**
 * Keeps a popover mounted for `exitMs` after it closes so a CSS exit
 * animation can play. `closing` is true from the moment `isOpen` goes false.
 * Under prefers-reduced-motion the element unmounts at once.
 */
export function usePresence(isOpen: boolean, exitMs: number) {
  const [isMounted, setIsMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setIsMounted(false),
      prefersReducedMotion ? 0 : exitMs,
    );
    return () => window.clearTimeout(timer);
  }, [isOpen, exitMs]);

  return { isPresent: isOpen || isMounted, isClosing: !isOpen };
}
