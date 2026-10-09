import { mean, measured, readinessFor, type LabInput, type MetricResult } from "./engine";
import { LAB_THRESHOLDS } from "./readiness";
import { boardHistories, REVIEW_DAYS } from "./review";

/**
 * Where the curve plots each delay: the review steps. A late review lands on the longest step it has passed, the one the
 * queue had it due at, so the next step's own review still has its point.
 */
const CURVE_DELAYS = REVIEW_DAYS;
export type CurveDay = 0 | (typeof CURVE_DELAYS)[number];

export interface CurvePoint {
  /** Days since first sight, 0 for the first sight itself. */
  readonly day: CurveDay;
  readonly accuracy: number;
  /** Boards behind the first-sight point, reviews behind every other. */
  readonly count: number;
}

export interface CurveValue {
  /** Only points with LAB_THRESHOLDS.curveReviews or more behind them, first sight first. */
  readonly points: readonly CurvePoint[];
  readonly reviews: number;
  /** Boards with a counted review. */
  readonly boards: number;
}

export const CURVE_THRESHOLDS = { reviews: LAB_THRESHOLDS.curveReviews };

/** For a delay of at least one day. */
const delayOf = (days: number): CurveDay => CURVE_DELAYS[CURVE_DELAYS.filter((day) => day <= days).length - 1];

/**
 * Recall on the reviewed boards, at first sight and after each delay. First sight comes only from the round that first
 * showed a board, and only a board's first review at each delay counts, so a repeat cannot pass for a first look or a
 * second review at the same gap.
 */
export function computeCurve(input: LabInput): MetricResult<CurveValue> {
  const byDay = new Map<CurveDay, number[]>();
  const firstSight: number[] = [];
  let boards = 0;
  for (const { first, reviews } of boardHistories(input.records)) {
    const counted = new Map<CurveDay, number>();
    for (const { reviewDelayDays = 0, accuracy } of reviews) {
      if (reviewDelayDays < 1) continue;
      const day = delayOf(reviewDelayDays);
      if (!counted.has(day)) counted.set(day, accuracy);
    }
    if (counted.size === 0) continue;
    boards += 1;
    if (first) firstSight.push(first.accuracy);
    counted.forEach((accuracy, day) => byDay.set(day, [...(byDay.get(day) ?? []), accuracy]));
  }
  const delays = CURVE_DELAYS.map((day) => ({ day, accuracies: byDay.get(day) ?? [] }));
  const reviews = delays.reduce((sum, { accuracies }) => sum + accuracies.length, 0);
  const readiness = readinessFor(input, {
    sampleSize: reviews,
    played: input.summary.rounds,
    have: { reviews: Math.max(...delays.map(({ accuracies }) => accuracies.length)) },
    thresholds: CURVE_THRESHOLDS,
  });

  return measured(readiness, () => ({
    points: [{ day: 0 as const, accuracies: firstSight }, ...delays]
      .filter(({ accuracies }) => accuracies.length >= LAB_THRESHOLDS.curveReviews)
      .map(({ day, accuracies }) => ({ day, accuracy: Math.round(mean(accuracies)), count: accuracies.length })),
    reviews,
    boards,
  }));
}
