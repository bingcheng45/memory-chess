import type { StreakDay } from "@/lib/lab/metrics";

export const SAMPLE_ACCURACY: readonly number[] = [52, 58, 55, 63, 61, 68, 66, 72, 70, 75, 74, 79];

/** Span after each of 12 sample sessions, for the staircase a new visitor sees. */
export const SAMPLE_SPAN: readonly number[] = [4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8];
export const SAMPLE_SPAN_SECONDS = 10;

/** A sample five-round average of pieces held; the first four average fewer rounds, so they draw dashed. */
export const SAMPLE_PIECES_HELD: readonly number[] = [4, 4.5, 4.7, 4.8, 5.1, 5.3, 5.6, 5.8, 6.1, 6.3, 6.6, 7];
export const SAMPLE_PARTIAL = 4;

export const SAMPLE_SPEED: readonly number[] = [4.1, 3.9, 3.8, 3.6, 3.5, 3.3, 3.2, 3, 2.9, 2.8, 2.7, 2.6];
export const SAMPLE_SPEED_ACCURACY = 88;

export const SAMPLE_STREAK: readonly StreakDay[] = [
  "played", "played", "missed", "played", "played", "played", "missed",
  "played", "played", "played", "played", "played", "played", "today",
];

export const SAMPLE_MISS_MAP: readonly number[] = (() => {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 64 }, (_, index) => {
    const file = index % 8;
    const fromEdge = Math.min(file, 7 - file);
    return Math.min(1, Math.max(0, (1 - fromEdge / 3) * 0.75 + next() * 0.25));
  });
})();

export const CURVE_REVIEW_DAYS: readonly number[] = [1, 3, 7];
export const CURVE_AXIS_DAYS: readonly number[] = [0, 1, 3, 7, 14];
export const CURVE_SPAN_DAYS = 14;
const NO_REVIEW_DECAY = 1.4;
const DECAY_AFTER_REVIEW: readonly number[] = [NO_REVIEW_DECAY, 3, 7, 18];
const STEPS = 140;

export function retentionNoReview(day: number): number {
  return Math.exp(-day / NO_REVIEW_DECAY);
}

export function retentionWithReviews(day: number): number {
  const reviews = [0, ...CURVE_REVIEW_DAYS];
  const last = reviews.filter((reviewDay) => day >= reviewDay).length - 1;
  return Math.exp(-(day - reviews[last]) / DECAY_AFTER_REVIEW[last]);
}

export function curvePath(
  retention: (day: number) => number,
  x: (day: number) => number,
  y: (value: number) => number,
): string {
  return Array.from({ length: STEPS + 1 }, (_, step) => {
    // Divide, not multiply: step / 10 lands exactly on the integer review days.
    const day = step / (STEPS / CURVE_SPAN_DAYS);
    const jump = CURVE_REVIEW_DAYS.includes(day) ? `L${x(day).toFixed(1)} ${y(retention(day - 1e-6)).toFixed(1)}` : "";
    return `${jump}${step === 0 ? "M" : "L"}${x(day).toFixed(1)} ${y(retention(day)).toFixed(1)}`;
  }).join("");
}
