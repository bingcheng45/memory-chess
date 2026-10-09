export const LAB_THRESHOLDS = {
  streakDays: 2,
  trendRounds: 5,
  trendDays: 2,
  typeExposures: 20,
  squareExposures: 10,
  trendPoints: 30,
  streakWindow: 14,
  staleDays: 14,
  /** Days since the last round before the record greets a returning player. */
  awayDays: 3,
  sessionTrendRounds: 8,
  sessionTrendSessions: 4,
  spanAccuracy: 80,
  spanRounds: 2,
  spanMinPieces: 3,
  speedSettingRounds: 20,
  rollingWindow: 10,
  movingAverage: 5,
  /** Recall under this share marks a piece type weak, in the chart and in the insights. */
  weakRecall: 0.5,
  /** A board scored under this comes back for review. */
  reviewBelow: 80,
  /** Days after first sight a board stays in the review queue. */
  reviewWindowDays: 28,
  /** Reviews behind a point before the forgetting curve plots it. */
  curveReviews: 3,
} as const;

/**
 * The one state model every lab panel reads. Empty: nothing to show yet.
 * Warming: some data, and `need` says exactly what is missing. Ready: the
 * figure can be read. Stale: ready, but no round in the last 14 days.
 */
export type ReadinessState = "empty" | "warming" | "ready" | "stale";

export interface Need {
  readonly rounds?: number;
  readonly days?: number;
  readonly exposures?: number;
  /** Rounds at 80% or better at one piece count. */
  readonly qualifyingRounds?: number;
  /** Rounds with more than the two kings. */
  readonly largerRounds?: number;
  /** Rounds with at least one piece right and a rebuild time, the only rounds speed can read. */
  readonly rightRounds?: number;
  /** Reviews at one delay, the most any point of the forgetting curve has. */
  readonly reviews?: number;
}

export interface Readiness {
  readonly state: ReadinessState;
  readonly sampleSize: number;
  readonly need?: Need;
}

interface ReadinessInput {
  /** What the figure is built from; zero means empty unless `played` says rounds exist. */
  readonly sampleSize: number;
  /** Rounds played at all, when that can differ from the sample: a player with rounds is never empty. */
  readonly played?: number;
  readonly have: Need;
  readonly thresholds: Need;
  readonly lastDay: string | null;
  /** The client's local day, or "" before it is known. */
  readonly today: string;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
const NEED_KEYS = ["rounds", "days", "exposures", "qualifyingRounds", "largerRounds", "rightRounds", "reviews"] as const;

const utcDay = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
};

export const daysBetween = (from: string, to: string) => Math.round((utcDay(to) - utcDay(from)) / DAY_MS);

/** Stale only replaces ready: a record that never warmed up still needs its missing rounds, however old it is. */
export function readinessOf({ sampleSize, played = sampleSize, have, thresholds, lastDay, today }: ReadinessInput): Readiness {
  if (played === 0) return { state: "empty", sampleSize };
  const missing = NEED_KEYS.flatMap((key) => {
    const gap = (thresholds[key] ?? 0) - (have[key] ?? 0);
    return gap > 0 ? [[key, gap] as const] : [];
  });
  if (missing.length > 0) return { state: "warming", sampleSize, need: Object.fromEntries(missing) };
  const stale = today !== "" && lastDay !== null && daysBetween(lastDay, today) >= LAB_THRESHOLDS.staleDays;
  return { state: stale ? "stale" : "ready", sampleSize };
}

/** Ready and stale both have a figure to draw. */
export const hasFigure = ({ state }: Readiness) => state === "ready" || state === "stale";
