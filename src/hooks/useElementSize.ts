'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Reports the rendered size of an element.
 *
 * Layout that depends on a measurement should read it from the element rather
 * than predicting it: predicting means restating, somewhere else, how tall
 * everything on the page is, and that copy goes stale the moment any of it
 * changes.
 *
 * The first measurement is taken before the browser paints, so nothing is ever
 * drawn at the zero size the state starts with. A board painted at zero and
 * then grown to fit moves everything around it, which browsers score as a
 * layout shift. Server rendering and jsdom, which has no layout, still see
 * zeroes, so callers must tolerate a zero size.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (width: number, height: number) =>
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );

    const { width, height } = element.getBoundingClientRect();
    update(width, height);

    // Absent in jsdom and in older browsers; the size is then the one read
    // above, kept until the next mount.
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) update(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
