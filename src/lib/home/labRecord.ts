import type { StreakDay } from "@/lib/lab/streak";
import type { NotebookEntry } from "@/lib/lab/notebook";
import type { PieceSymbol } from "chess.js";

export const SAMPLE_ACCURACY: readonly number[] = [52, 58, 55, 63, 61, 68, 66, 72, 70, 75, 74, 79];

export const SAMPLE_SPAN: readonly number[] = [4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8];
export const SAMPLE_SPAN_SECONDS = 10;
export const SAMPLE_SPAN_ROUNDS = 3;

/** A sample five-round average of pieces held; the first four average fewer rounds, so they draw dashed. */
export const SAMPLE_PIECES_HELD: readonly number[] = [4, 4.5, 4.7, 4.8, 5.1, 5.3, 5.6, 5.8, 6.1, 6.3, 6.6, 7];
export const SAMPLE_PARTIAL = 4;

export const SAMPLE_SPEED: readonly number[] = [4.1, 3.9, 3.8, 3.6, 3.5, 3.3, 3.2, 3, 2.9, 2.8, 2.7, 2.6];
export const SAMPLE_SPEED_ACCURACY = 88;


/** Recall shares, in percent, for the sample piece bars, with the king last as the baseline. */
export const SAMPLE_TYPE_RECALL: readonly { readonly type: PieceSymbol; readonly share: number }[] = [
  { type: "q", share: 82 },
  { type: "r", share: 74 },
  { type: "b", share: 61 },
  { type: "n", share: 48 },
  { type: "p", share: 39 },
  { type: "k", share: 96 },
];

export const SAMPLE_NOTEBOOK: readonly Pick<NotebookEntry, "kind" | "params">[] = [
  { kind: "span", params: { day: 12, from: 6, to: 8 } },
  { kind: "first90", params: { day: 9, pieceCount: 8 } },
  { kind: "streak", params: { day: 7, days: 7, forgiven: 0 } },
  { kind: "rounds", params: { day: 4, count: 10 } },
  { kind: "firstRound", params: { day: 1, pieceCount: 6, accuracy: 67 } },
];

/** One missed day forgiven, and an earlier miss inside the same week that the walk back could not forgive. */
export const SAMPLE_STREAK: readonly StreakDay[] = [
  "played", "played", "missed", "played", "played", "played", "forgiven",
  "played", "played", "played", "played", "played", "played", "today",
];

export const SAMPLE_WEEK = { played: 4, goal: 5 } as const;

/** The goal the roadmap names as its example, with a best round short of it. */
export const SAMPLE_GOAL = { pieceCount: 8, accuracy: 85, best: 78 } as const;

/**
 * Miss shares, in percent, rank 8 down to rank 1 and a to h: a blind h-file that is worst in the corner around h1, where
 * White's king sits after castling, hot spots on b7, f7 and g7, and a centre that is rarely missed.
 */
const SAMPLE_MISS_PERCENT: readonly (readonly number[])[] = [
  [14, 16, 14, 13, 15, 19, 30, 48],
  [12, 52, 17, 12, 14, 58, 47, 56],
  [10, 13, 11, 9, 10, 13, 18, 45],
  [9, 11, 8, 6, 7, 10, 16, 50],
  [10, 10, 9, 5, 6, 11, 17, 53],
  [11, 12, 10, 8, 9, 14, 22, 57],
  [12, 14, 13, 11, 12, 22, 62, 74],
  [13, 16, 14, 12, 15, 26, 70, 86],
];

export const SAMPLE_MISS_MAP: readonly number[] = SAMPLE_MISS_PERCENT.flat().map((percent) => percent / 100);

const sampleFileMiss = (files: readonly number[]) => {
  const squares = SAMPLE_MISS_PERCENT.flatMap((rank) => files.map((file) => rank[file]));
  return Math.round(squares.reduce((sum, percent) => sum + percent, 0) / squares.length);
};

/** Miss shares, in percent, on the a and h files and on the d and e files, read off the sample map so the sample finding matches it. */
export const SAMPLE_EDGE_MISS = { edge: sampleFileMiss([0, 7]), centre: sampleFileMiss([3, 4]) };

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
