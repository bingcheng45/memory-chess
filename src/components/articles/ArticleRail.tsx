"use client";

import { useEffect, useRef, type ReactNode } from "react";

const RAIL_HEIGHT_PROPERTY = "--rail-height";

export default function ArticleRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rail.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      element.style.setProperty(RAIL_HEIGHT_PROPERTY, `${entry.contentRect.height}px`);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rail}
      data-article-rail
      className="contents min-[821px]:sticky min-[821px]:col-start-1 min-[821px]:row-span-2 min-[821px]:row-start-1 min-[821px]:block"
    >
      {children}
    </div>
  );
}
