"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * The height the dashboard figures keep while they are in view before they arrive: every figure ready, in the longest
 * copy, measured at 320 to 1440 wide. result-deltas-heights.json holds the measurements.
 */
export const RESULT_DELTAS_RESERVE = "min-h-[760px] sm:min-h-[420px] lg:min-h-[400px]";

/**
 * Where the dashboard figures go. Starting in view, it keeps the tallest list's height, so nothing under it moves when
 * the figures arrive. Starting below the fold, where nobody sees a move, it keeps none and fits the list it gets.
 */
export default function ResultDeltasFrame({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [reserved, setReserved] = useState(true);

  useLayoutEffect(() => {
    const top = frame.current?.getBoundingClientRect().top;
    if (top !== undefined && top >= window.innerHeight) setReserved(false);
  }, []);

  return (
    <div ref={frame} data-testid="result-deltas-frame" className={reserved ? RESULT_DELTAS_RESERVE : undefined}>
      {children}
    </div>
  );
}
