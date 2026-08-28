'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Reports the rendered size of an element.
 *
 * Layout that depends on a measurement should read it from the element rather
 * than predicting it: predicting means restating, somewhere else, how tall
 * everything on the page is, and that copy goes stale the moment any of it
 * changes.
 *
 * Returns zeroes until the first measurement, which is also what server
 * rendering and jsdom see, so callers must tolerate a zero size.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Absent in jsdom and in older browsers; a zero size renders a board that
    // is laid out by CSS but has no pieces drawn on it, rather than crashing.
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
