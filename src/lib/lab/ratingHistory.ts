export interface RatingStep {
  readonly at: number;
  /** The rating after the round. */
  readonly rating: number;
  readonly change: number;
}

/** The change a player reads beside the rating: the last `days`, or every held round when none fall in them. */
export type RatingPeriod =
  | { readonly kind: "days"; readonly days: number; readonly change: number; readonly rounds: number }
  | { readonly kind: "rounds"; readonly change: number; readonly rounds: number };

export interface RatingHistory {
  readonly current: number;
  /** The rating before the oldest held round. */
  readonly start: number;
  /** Oldest first. */
  readonly steps: readonly RatingStep[];
  /** An index into `[start, ...steps]`, the latest when several tie. */
  readonly peak: { readonly index: number; readonly rating: number };
  readonly isNewPeak: boolean;
  readonly period: RatingPeriod;
}

export const RATING_PERIOD_DAYS = 7;

const DAY_MS = 86_400_000;

/**
 * The rating after each held round, walked back from the current rating through the stored changes. Replaying the rounds
 * would not land on the rating the player sees: the store drops rounds past its newest 30, and the rating deviation
 * before the oldest one it holds is unknown. `rows` run newest first, as the store keeps them.
 */
export function ratingHistoryOf(
  current: number,
  rows: readonly { timestamp: number; skillRatingChange?: number }[],
  now: number,
  days = RATING_PERIOD_DAYS,
): RatingHistory {
  const rated = rows.flatMap(({ timestamp, skillRatingChange }) => (typeof skillRatingChange === "number" ? [{ at: timestamp, change: skillRatingChange }] : [])).reverse();
  const start = rated.reduce((rating, { change }) => rating - change, current);
  const steps = rated.reduce<RatingStep[]>((held, { at, change }) => [...held, { at, change, rating: (held.at(-1)?.rating ?? start) + change }], []);
  const peak = [start, ...steps.map((step) => step.rating)].reduce((found, value, index) => (value >= found.rating ? { index, rating: value } : found), { index: 0, rating: start });
  const recent = steps.filter(({ at }) => at >= now - days * DAY_MS);
  const period: RatingPeriod =
    recent.length > 0
      ? { kind: "days", days, change: recent.reduce((sum, { change }) => sum + change, 0), rounds: recent.length }
      : { kind: "rounds", change: current - start, rounds: steps.length };
  return { current, start, steps, peak, isNewPeak: steps.length > 0 && peak.index === steps.length && current > start, period };
}
