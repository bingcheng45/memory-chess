"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CURVE_AXIS_DAYS,
  CURVE_REVIEW_DAYS,
  CURVE_SPAN_DAYS,
  SAMPLE_ACCURACY,
  SAMPLE_MISS_MAP,
  SAMPLE_STREAK,
  curvePath,
  retentionNoReview,
  retentionWithReviews,
} from "@/lib/home/labRecord";
import type { StreakDay } from "@/lib/lab/metrics";

const CURVE = { left: 44, right: 580, bottom: 210, top: 20 };
const curveX = (day: number) => CURVE.left + ((CURVE.right - CURVE.left) * day) / CURVE_SPAN_DAYS;
const curveY = (value: number) => CURVE.bottom - (CURVE.bottom - CURVE.top) * value;
const RETENTION_TICKS = [0, 0.25, 0.5, 0.75, 1];

export function ForgettingCurve() {
  const t = useTranslations("home.lab.record.curve");

  return (
    <svg className="lab-chart" viewBox="0 0 600 250" role="img" aria-label={t("aria")}>
      {RETENTION_TICKS.map((value) => (
        <g key={value}>
          <line className="lab-c-grid" x1={CURVE.left} x2={CURVE.right} y1={curveY(value)} y2={curveY(value)} />
          <text x={CURVE.left - 8} y={curveY(value) + 4} textAnchor="end">
            {value * 100}%
          </text>
        </g>
      ))}
      {CURVE_AXIS_DAYS.map((day) => (
        <g key={day}>
          <line className="lab-c-tick" x1={curveX(day)} x2={curveX(day)} y1={CURVE.bottom} y2={CURVE.bottom + 5} />
          <text x={curveX(day)} y={CURVE.bottom + 20} textAnchor="middle">
            {t("day", { day })}
          </text>
        </g>
      ))}
      <path className="lab-c-base" d={curvePath(retentionNoReview, curveX, curveY)} />
      <path className="lab-c-spaced" d={curvePath(retentionWithReviews, curveX, curveY)} />
      {CURVE_REVIEW_DAYS.map((day) => (
        <g key={day}>
          <line className="lab-c-review" x1={curveX(day)} x2={curveX(day)} y1={CURVE.top} y2={CURVE.bottom} />
          <text className="lab-c-review-label" x={curveX(day) + 4} y={CURVE.top + 10}>
            {t("review")}
          </text>
        </g>
      ))}
      <text x={curveX(1.6)} y={curveY(0.12)}>
        {t("noReview")}
      </text>
      <text className="lab-c-spaced-label" x={curveX(9.2)} y={curveY(0.86)}>
        {t("spaced")}
      </text>
    </svg>
  );
}

const SPARK = { width: 290, height: 110, pad: 8 };
const SAMPLE_DOMAIN = { low: 40, high: 90 };
const FULL_DOMAIN = { low: 0, high: 100 };
const SPARK_GUIDES = [50, 70];

interface SparklineProps {
  readonly points?: readonly number[];
  readonly label: string;
  readonly first: string;
  readonly last: string;
}

export function AccuracySparkline({ points = SAMPLE_ACCURACY, label, first, last }: SparklineProps) {
  const domain = points === SAMPLE_ACCURACY ? SAMPLE_DOMAIN : FULL_DOMAIN;
  const x = (index: number) => SPARK.pad + ((SPARK.width - 2 * SPARK.pad) * index) / Math.max(1, points.length - 1);
  const y = (value: number) =>
    SPARK.height - ((value - domain.low) / (domain.high - domain.low)) * (SPARK.height - 14);
  const coords = points.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`);
  const lastIndex = points.length - 1;
  const latest = points[lastIndex];

  return (
    <svg className="lab-chart" viewBox="0 0 300 140" role="img" aria-label={label}>
      {SPARK_GUIDES.map((value) => (
        <g key={value}>
          <line className="lab-c-grid" x1={SPARK.pad} x2={SPARK.width - SPARK.pad} y1={y(value)} y2={y(value)} />
          <text x={SPARK.width - 6} y={y(value) - 4} textAnchor="end">
            {value}%
          </text>
        </g>
      ))}
      <polygon className="lab-c-area" points={`${x(0)},${SPARK.height} ${coords.join(" ")} ${x(lastIndex)},${SPARK.height}`} />
      <polyline className="lab-c-line" points={coords.join(" ")} />
      <circle className="lab-c-last" cx={x(lastIndex)} cy={y(latest)} r={4.5} />
      <text className="lab-c-last-label" x={x(lastIndex) - 8} y={y(latest) - 10} textAnchor="end">
        {latest}%
      </text>
      <text x={SPARK.pad} y={SPARK.height + 22}>
        {first}
      </text>
      <text x={SPARK.width - SPARK.pad} y={SPARK.height + 22} textAnchor="end">
        {last}
      </text>
    </svg>
  );
}

const HEAT_FLOOR = 0.08;
const HEAT_RANGE = 0.85;
const heatOpacity = (value: number) => Number((HEAT_FLOOR + value * HEAT_RANGE).toFixed(2));

export function MissMap({ cells = SAMPLE_MISS_MAP, label }: { readonly cells?: readonly (number | null)[]; readonly label: string }) {
  return (
    <div className="lab-heat" role="img" aria-label={label}>
      {cells.map((value, index) =>
        value === null ? <i key={index} data-thin="" /> : <i key={index} style={{ opacity: heatOpacity(value) }} />,
      )}
    </div>
  );
}

interface MissLine {
  readonly name: string;
  readonly value: number | null;
  readonly label: string;
}

export function MissLines({ lines, caption }: { readonly lines: readonly MissLine[]; readonly caption: string }) {
  return (
    <div className="lab-heat-lines">
      <span className="lab-k">{caption}</span>
      <ul>
        {lines.map(({ name, value, label }) => (
          <li key={name} aria-label={label}>
            {value === null ? <i data-thin="" /> : <i style={{ opacity: heatOpacity(value) }} />}
            <span aria-hidden="true">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StreakGrid({ days = SAMPLE_STREAK, label }: { readonly days?: readonly StreakDay[]; readonly label: string }) {
  return (
    <div className="lab-streak" role="img" aria-label={label}>
      {days.map((day, index) => (
        <i key={index} data-day={day} />
      ))}
    </div>
  );
}

const WEAK_RECALL = 0.5;

export function RecallBar({ label, share, value }: { label: ReactNode; share: number | null; value: ReactNode }) {
  return (
    <div className="lab-bar" data-thin={share === null ? "" : undefined}>
      <span>{label}</span>
      <span className="lab-bar-track">
        {share !== null && (
          <i style={{ width: `${Math.round(share * 100)}%` }} data-low={share < WEAK_RECALL || undefined} />
        )}
      </span>
      <span className="lab-bar-value">{value}</span>
    </div>
  );
}
