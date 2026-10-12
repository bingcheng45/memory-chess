"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Trend } from "@/lib/lab/dashboard";
import "./trend.css";

const ARROW_POINTS = { up: "6,1 11,10 1,10", down: "6,11 11,2 1,2" } as const;

interface TrendChipProps {
  readonly trend: Trend;
  /** Which way of the number is progress. The arrow and its colour follow progress, so a fall in seconds per piece points up. */
  readonly betterWhen?: "higher" | "lower";
  /** The chip's spoken name; the rating's rise or fall when left out. */
  readonly label?: string;
}

/**
 * How far a figure moved, beside it rather than in the sentence, so every language's word order leaves it where it is.
 * The arrow carries the meaning, the colour only echoes it, and where the arrow and the number's own direction part,
 * the number prints its sign. A level figure draws nothing.
 */
export function TrendChip({ trend, betterWhen = "higher", label }: TrendChipProps) {
  const t = useTranslations("dashboard.history");
  const format = useFormatter();
  if (trend.direction === "level") return null;
  const better = (trend.direction === "up") === (betterWhen === "higher");
  const arrow = better ? "up" : "down";
  const shown = arrow === trend.direction ? format.number(trend.amount) : format.number(trend.direction === "up" ? trend.amount : -trend.amount, { signDisplay: "always" });
  return (
    <span
      className="lab-trend"
      data-trend={trend.direction}
      data-tone={better ? "better" : "worse"}
      role="img"
      aria-label={label ?? t(trend.direction === "up" ? "ratingUp" : "ratingDown", { change: trend.amount })}
    >
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false" data-arrow={arrow}>
        <polygon points={ARROW_POINTS[arrow]} fill="currentColor" />
      </svg>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
