/**
 * Sample and illustrative data for the lab record section. None of it is
 * measured; every panel that draws it carries a Sample or Illustrative tag.
 */

export const SAMPLE_ACCURACY: readonly number[] = [52, 58, 55, 63, 61, 68, 66, 72, 70, 75, 74, 79];

export type StreakDay = "played" | "missed" | "today";

export const SAMPLE_STREAK: readonly StreakDay[] = [
  "played", "played", "missed", "played", "played", "played", "missed",
  "played", "played", "played", "played", "played", "played", "today",
];

/** Miss intensity per square, 0 to 1, a8 first; concentrated on the edge files. */
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
// Each review restarts the fade with a slower decay: the spacing effect.
const DECAY_AFTER_REVIEW: readonly number[] = [NO_REVIEW_DECAY, 3, 7, 18];
const STEPS = 140;

/** Retention (0 to 1) against day for the illustrative forgetting curve. */
export function retentionNoReview(day: number): number {
  return Math.exp(-day / NO_REVIEW_DECAY);
}

export function retentionWithReviews(day: number): number {
  const reviews = [0, ...CURVE_REVIEW_DAYS];
  const last = reviews.filter((reviewDay) => day >= reviewDay).length - 1;
  return Math.exp(-(day - reviews[last]) / DECAY_AFTER_REVIEW[last]);
}

/** SVG path through `retention`, with a vertical jump at each review day. */
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
