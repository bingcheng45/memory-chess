"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Trend } from "@/lib/lab/dashboard";

const ARROW_POINTS = { up: "6,1 11,10 1,10", down: "6,11 11,2 1,2" } as const;

/**
 * How far the rating moved, beside its figure rather than in the sentence, so every language's word order leaves it
 * where it is. The arrow's direction carries the meaning; the colour only echoes it. A level rating draws nothing.
 */
export function TrendChip({ trend }: { trend: Trend }) {
  const t = useTranslations("dashboard.history");
  const format = useFormatter();
  if (trend.direction === "level") return null;
  const label = t(trend.direction === "up" ? "ratingUp" : "ratingDown", { change: trend.amount });
  return (
    <span className="lab-trend" data-trend={trend.direction} role="img" aria-label={label}>
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false" data-arrow={trend.direction}>
        <polygon points={ARROW_POINTS[trend.direction]} fill="currentColor" />
      </svg>
      <span aria-hidden="true">{format.number(trend.amount)}</span>
    </span>
  );
}
