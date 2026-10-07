import type { PieceSymbol } from "chess.js";
import { configKey, LAB_SOURCES, localDayOf, PIECE_LETTERS, type LabSource, type RoundConfig, type RoundRecordV1 } from "./record";
import type { LabSummary, PersonalBest } from "./summary";

/** Below these a panel shows how much more data it needs instead of a number. */
export const LAB_THRESHOLDS = {
  streakDays: 2,
  trendRounds: 5,
  trendDays: 2,
  typeExposures: 20,
  squareExposures: 10,
  trendPoints: 30,
  streakWindow: 14,
} as const;

export type StreakDay = "played" | "missed" | "today";

export interface StreakResult {
  readonly ready: boolean;
  readonly sampleSize: number;
  /** Consecutive days played, ending today, or yesterday if today has no round yet. */
  readonly current: number;
  readonly longest: number;
  /** The last 14 days, oldest first; today reads "played" once a round is in. */
  readonly window: readonly StreakDay[];
  readonly daysNeeded: number;
}

function shiftDay(day: string, by: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return localDayOf(new Date(year, month - 1, date + by));
}

/** Consecutive played days from `day`, stepping one day back (-1) or forward (1). */
function run(played: ReadonlySet<string>, day: string, step: -1 | 1): number {
  let length = 0;
  while (played.has(shiftDay(day, step * length))) length += 1;
  return length;
}

export function deriveStreak(days: readonly string[], today: string): StreakResult {
  const played = new Set(days);
  const current = run(played, played.has(today) ? today : shiftDay(today, -1), -1);
  const longest = days.reduce(
    (max, day) => (played.has(shiftDay(day, -1)) ? max : Math.max(max, run(played, day, 1))),
    0,
  );
  const window = Array.from({ length: LAB_THRESHOLDS.streakWindow }, (_, index): StreakDay => {
    const day = shiftDay(today, index - (LAB_THRESHOLDS.streakWindow - 1));
    if (played.has(day)) return "played";
    return day === today ? "today" : "missed";
  });

  return {
    ready: days.length >= LAB_THRESHOLDS.streakDays,
    sampleSize: days.length,
    current,
    longest,
    window,
    daysNeeded: Math.max(0, LAB_THRESHOLDS.streakDays - days.length),
  };
}

export interface BestEntry extends PersonalBest {
  /** The summary's bestKey, unique per entry. */
  readonly key: string;
  readonly source: LabSource;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

export interface BestsResult {
  readonly ready: boolean;
  readonly sampleSize: number;
  readonly entries: readonly BestEntry[];
}

export function deriveBests(summary: LabSummary): BestsResult {
  const entries = Object.entries(summary.bests)
    .map(([key, best]) => {
      const [source, config] = key.split(":");
      const [pieceCount, memorizeSeconds] = config.split("x").map(Number);
      return { ...best, key, source: source as LabSource, pieceCount, memorizeSeconds };
    })
    .sort(
      (a, b) =>
        LAB_SOURCES.indexOf(a.source) - LAB_SOURCES.indexOf(b.source) ||
        a.pieceCount - b.pieceCount ||
        b.memorizeSeconds - a.memorizeSeconds,
    );
  return { ready: entries.length > 0, sampleSize: summary.rounds, entries };
}

export interface TrendResult {
  readonly ready: boolean;
  /** Rounds at the plotted config. */
  readonly sampleSize: number;
  readonly config: Pick<RoundConfig, "pieceCount" | "memorizeSeconds"> | null;
  /** Accuracy per round at that config, oldest first, the latest 30. */
  readonly points: readonly number[];
  readonly roundsNeeded: number;
  readonly daysNeeded: number;
}

/** Accuracy for the most-played config only: mixing configs would read harder rounds as decline. */
export function deriveTrend(records: readonly RoundRecordV1[]): TrendResult {
  const byConfig = new Map<string, { rounds: RoundRecordV1[]; latest: number }>();
  records.forEach((record) => {
    const key = configKey(record.config);
    const group = byConfig.get(key);
    if (!group) byConfig.set(key, { rounds: [record], latest: record.endedAt });
    else {
      group.rounds.push(record);
      group.latest = Math.max(group.latest, record.endedAt);
    }
  });
  const rounds =
    [...byConfig.values()].sort((a, b) => b.rounds.length - a.rounds.length || b.latest - a.latest)[0]?.rounds ?? [];
  const sorted = [...rounds].sort((a, b) => a.endedAt - b.endedAt);
  const days = new Set(sorted.map((record) => record.localDay)).size;
  const roundsNeeded = Math.max(0, LAB_THRESHOLDS.trendRounds - sorted.length);
  const daysNeeded = Math.max(0, LAB_THRESHOLDS.trendDays - days);

  return {
    ready: roundsNeeded === 0 && daysNeeded === 0,
    sampleSize: sorted.length,
    config: sorted[0] ? { pieceCount: sorted[0].config.pieceCount, memorizeSeconds: sorted[0].config.memorizeSeconds } : null,
    points: sorted.slice(-LAB_THRESHOLDS.trendPoints).map((record) => record.accuracy),
    roundsNeeded,
    daysNeeded,
  };
}

export interface TypeRecall {
  readonly type: PieceSymbol;
  readonly shown: number;
  readonly recalled: number;
  readonly ready: boolean;
}

export interface TypeRecallResult {
  readonly ready: boolean;
  readonly sampleSize: number;
  readonly types: readonly TypeRecall[];
  /** Rough rounds until the most-seen type reaches its threshold; null with no rounds. */
  readonly roundsNeeded: number | null;
}

function roundsToReach(threshold: number, have: number, rounds: number): number | null {
  if (have >= threshold) return 0;
  if (rounds === 0 || have === 0) return null;
  return Math.ceil(((threshold - have) * rounds) / have);
}

export function deriveTypeRecall(summary: LabSummary): TypeRecallResult {
  const types = PIECE_LETTERS.map((type) => {
    const shown = summary.typeShown[type] ?? 0;
    return {
      type,
      shown,
      recalled: shown - (summary.typeMissed[type] ?? 0),
      ready: shown >= LAB_THRESHOLDS.typeExposures,
    };
  });
  const mostShown = Math.max(...types.map(({ shown }) => shown));
  return {
    ready: types.some(({ ready }) => ready),
    sampleSize: summary.rounds,
    types,
    roundsNeeded: roundsToReach(LAB_THRESHOLDS.typeExposures, mostShown, summary.rounds),
  };
}

export interface MissCell {
  readonly shown: number;
  readonly missed: number;
  readonly ready: boolean;
}

export interface MissMapResult {
  readonly ready: boolean;
  readonly sampleSize: number;
  /** "squares" once every square has enough exposures, else files and ranks. */
  readonly view: "squares" | "lines";
  readonly squares: readonly MissCell[];
  /** a to h. */
  readonly files: readonly MissCell[];
  /** 8 down to 1, matching the board's reading order. */
  readonly ranks: readonly MissCell[];
  readonly roundsNeeded: number | null;
}

function cell(shown: number, missed: number): MissCell {
  return { shown, missed, ready: shown >= LAB_THRESHOLDS.squareExposures };
}

function sumLine(values: readonly number[], inLine: (index: number) => boolean): number {
  return values.reduce((sum, value, index) => (inLine(index) ? sum + value : sum), 0);
}

export function deriveMissMap(summary: LabSummary): MissMapResult {
  const { squareShown, squareMissed } = summary;
  const line = (inLine: (index: number) => boolean) => cell(sumLine(squareShown, inLine), sumLine(squareMissed, inLine));
  const files = Array.from({ length: 8 }, (_, file) => line((index) => index % 8 === file));
  const ranks = Array.from({ length: 8 }, (_, row) => line((index) => Math.floor(index / 8) === row));
  const squares = squareShown.map((shown, index) => cell(shown, squareMissed[index]));
  const thinnest = Math.min(...files.map(({ shown }) => shown), ...ranks.map(({ shown }) => shown));

  return {
    ready: thinnest >= LAB_THRESHOLDS.squareExposures,
    sampleSize: summary.rounds,
    view: squares.every(({ ready }) => ready) ? "squares" : "lines",
    squares,
    files,
    ranks,
    roundsNeeded: roundsToReach(LAB_THRESHOLDS.squareExposures, thinnest, summary.rounds),
  };
}
