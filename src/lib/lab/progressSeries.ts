import { mean } from "./engine";

export type BetterWhen = "higher" | "lower";
export type Tone = "better" | "worse" | "level";

/** A noisy per-round line read for progress: its trailing mean, its best round and which way it went. */
export interface ProgressSeries {
  /** Oldest first. */
  readonly values: readonly number[];
  /** The trailing mean at each round, over the rounds held so far while fewer than the window. */
  readonly rolling: readonly number[];
  /** The latest round when several tie, so a matched best reads as fresh. */
  readonly best: { readonly index: number; readonly value: number };
  readonly latest: number;
  readonly tone: Tone;
}

export const PROGRESS_WINDOW = 5;

export function rollingMean(values: readonly number[], window: number): number[] {
  return values.map((_, index) => mean(values.slice(Math.max(0, index - window + 1), index + 1)));
}

/**
 * Tone compares the mean of the last k rounds with the first k, k at most the window and at most half the rounds, so the
 * two never overlap. A move within `levelBand` is level: round-to-round noise is not progress. `values` is not empty.
 */
export function progressOf(
  values: readonly number[],
  { betterWhen, window, levelBand }: { betterWhen: BetterWhen; window: number; levelBand: number },
): ProgressSeries {
  const sign = betterWhen === "higher" ? 1 : -1;
  const best = values.reduce((found, value, index) => (sign * (value - found.value) >= 0 ? { index, value } : found), { index: 0, value: values[0] });
  const k = Math.min(window, Math.floor(values.length / 2));
  const gain = k === 0 ? 0 : sign * (mean(values.slice(-k)) - mean(values.slice(0, k)));
  const tone: Tone = Math.abs(gain) <= levelBand ? "level" : gain > 0 ? "better" : "worse";
  return { values, rolling: rollingMean(values, window), best, latest: values[values.length - 1], tone };
}
