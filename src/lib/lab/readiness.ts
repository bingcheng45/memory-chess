export const LAB_THRESHOLDS = {
  streakDays: 2,
  trendRounds: 5,
  trendDays: 2,
  typeExposures: 20,
  squareExposures: 10,
  trendPoints: 30,
  streakWindow: 14,
  staleDays: 14,
  sessionTrendRounds: 8,
  sessionTrendSessions: 4,
  spanAccuracy: 80,
  spanRounds: 2,
  usualTimeRounds: 20,
  rollingWindow: 10,
  movingAverage: 5,
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
  /** Rounds at 80% or better at one piece count, at the usual study time. */
  readonly qualifyingRounds?: number;
}

export interface Readiness {
  readonly state: ReadinessState;
  readonly sampleSize: number;
  readonly need?: Need;
}

interface ReadinessInput {
  /** What the figure is built from; zero means empty. */
  readonly sampleSize: number;
  readonly have: Need;
  readonly thresholds: Need;
  readonly lastDay: string | null;
  /** The client's local day, or "" before it is known. */
  readonly today: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const NEED_KEYS = ["rounds", "days", "exposures", "qualifyingRounds"] as const;

const utcDay = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
};

export const daysBetween = (from: string, to: string) => Math.round((utcDay(to) - utcDay(from)) / DAY_MS);

/** Stale only replaces ready: a record that never warmed up still needs its missing rounds, however old it is. */
export function readinessOf({ sampleSize, have, thresholds, lastDay, today }: ReadinessInput): Readiness {
  if (sampleSize === 0) return { state: "empty", sampleSize };
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
