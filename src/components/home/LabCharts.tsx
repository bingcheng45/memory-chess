"use client";

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

const SPARK = { width: 290, height: 110, low: 40, high: 90, pad: 8 };
const sparkX = (index: number) => SPARK.pad + ((SPARK.width - 2 * SPARK.pad) * index) / (SAMPLE_ACCURACY.length - 1);
const sparkY = (value: number) => SPARK.height - ((value - SPARK.low) / (SPARK.high - SPARK.low)) * (SPARK.height - 14);
const SPARK_GUIDES = [50, 70];

export function AccuracySparkline() {
  const t = useTranslations("home.lab.record.spark");
  const points = SAMPLE_ACCURACY.map((value, index) => `${sparkX(index).toFixed(1)},${sparkY(value).toFixed(1)}`);
  const lastIndex = SAMPLE_ACCURACY.length - 1;
  const last = SAMPLE_ACCURACY[lastIndex];

  return (
    <svg className="lab-chart" viewBox="0 0 300 140" role="img" aria-label={t("aria")}>
      {SPARK_GUIDES.map((value) => (
        <g key={value}>
          <line className="lab-c-grid" x1={SPARK.pad} x2={SPARK.width - SPARK.pad} y1={sparkY(value)} y2={sparkY(value)} />
          <text x={SPARK.width - 6} y={sparkY(value) - 4} textAnchor="end">
            {value}%
          </text>
        </g>
      ))}
      <polygon
        className="lab-c-area"
        points={`${sparkX(0)},${SPARK.height} ${points.join(" ")} ${sparkX(lastIndex)},${SPARK.height}`}
      />
      <polyline className="lab-c-line" points={points.join(" ")} />
      <circle className="lab-c-last" cx={sparkX(lastIndex)} cy={sparkY(last)} r={4.5} />
      <text className="lab-c-last-label" x={sparkX(lastIndex) - 8} y={sparkY(last) - 10} textAnchor="end">
        {last}%
      </text>
      <text x={SPARK.pad} y={SPARK.height + 22}>
        {t("first")}
      </text>
      <text x={SPARK.width - SPARK.pad} y={SPARK.height + 22} textAnchor="end">
        {t("last")}
      </text>
    </svg>
  );
}

const HEAT_FLOOR = 0.08;
const HEAT_RANGE = 0.85;

export function MissMap() {
  const t = useTranslations("home.lab.record.heat");
  return (
    <div className="lab-heat" role="img" aria-label={t("aria")}>
      {SAMPLE_MISS_MAP.map((value, index) => (
        <i key={index} style={{ opacity: Number((HEAT_FLOOR + value * HEAT_RANGE).toFixed(2)) }} />
      ))}
    </div>
  );
}

export function StreakGrid() {
  const t = useTranslations("home.lab.record.streak");
  return (
    <div className="lab-streak" role="img" aria-label={t("aria")}>
      {SAMPLE_STREAK.map((day, index) => (
        <i key={index} data-day={day} />
      ))}
    </div>
  );
}
