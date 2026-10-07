import type { PieceSymbol } from "chess.js";
import { hasFigure, readinessOf, LAB_THRESHOLDS, type Need, type Readiness, type Thresholds } from "./readiness";
import { LAB_SOURCES, localDayOf, PIECE_LETTERS, settingKey, type LabSource, type RoundConfig, type RoundRecordV1 } from "./record";
import type { LabSummary, PersonalBest } from "./summary";

export interface LabInput {
  /** The capped round log, oldest first or in any order. */
  readonly records: readonly RoundRecordV1[];
  readonly summary: LabSummary;
  /** The client's local day, passed in so every metric is a pure function of its input. */
  readonly today: string;
}

/** A metric's value is null exactly when its readiness is empty. */
export interface MetricResult<TValue> {
  readonly readiness: Readiness;
  readonly value: TValue | null;
}

export interface MetricDef<TValue> {
  readonly id: MetricId;
  /** The question the metric answers, in one plain sentence. */
  readonly question: string;
  readonly thresholds: Thresholds;
  compute(input: LabInput): MetricResult<TValue>;
}

function measured<TValue>(readiness: Readiness, value: () => TValue): MetricResult<TValue> {
  return { readiness, value: readiness.state === "empty" ? null : value() };
}

/** Staleness reads the player's last day of play, the same for every metric. */
function readinessFor({ summary, today }: LabInput, measure: { sampleSize: number; have: Need; thresholds: Thresholds }): Readiness {
  return readinessOf({ ...measure, lastDay: summary.days.at(-1) ?? null, today });
}

// Streak

export type StreakDay = "played" | "missed" | "today";

export interface StreakValue {
  /** Consecutive days played, ending today, or yesterday if today has no round yet. */
  readonly current: number;
  readonly longest: number;
  readonly window: readonly StreakDay[];
}

function shiftDay(day: string, by: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return localDayOf(new Date(year, month - 1, date + by));
}

function run(played: ReadonlySet<string>, day: string, step: -1 | 1): number {
  let length = 0;
  while (played.has(shiftDay(day, step * length))) length += 1;
  return length;
}

const STREAK_THRESHOLDS = { days: LAB_THRESHOLDS.streakDays };

function computeStreak(input: LabInput): MetricResult<StreakValue> {
  const { summary: { days }, today } = input;
  const readiness = readinessFor(input, { sampleSize: days.length, have: { days: days.length }, thresholds: STREAK_THRESHOLDS });
  return measured(readiness, () => {
    const played = new Set(days);
    return {
      current: run(played, played.has(today) ? today : shiftDay(today, -1), -1),
      longest: days.reduce((max, day) => (played.has(shiftDay(day, -1)) ? max : Math.max(max, run(played, day, 1))), 0),
      window: Array.from({ length: LAB_THRESHOLDS.streakWindow }, (_, index): StreakDay => {
        const day = shiftDay(today, index - (LAB_THRESHOLDS.streakWindow - 1));
        if (played.has(day)) return "played";
        return day === today ? "today" : "missed";
      }),
    };
  });
}

// Personal bests

export interface BestEntry extends PersonalBest {
  readonly key: string;
  readonly source: LabSource;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

export interface BestsValue {
  readonly entries: readonly BestEntry[];
}

const BESTS_THRESHOLDS = { rounds: 1 };

function computeBests(input: LabInput): MetricResult<BestsValue> {
  const { summary } = input;
  const readiness = readinessFor(input, { sampleSize: summary.rounds, have: { rounds: summary.rounds }, thresholds: BESTS_THRESHOLDS });
  return measured(readiness, () => ({
    entries: Object.entries(summary.bests)
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
      ),
  }));
}

// Accuracy trend

export type TrendSetting = Pick<RoundConfig, "pieceCount" | "memorizeSeconds"> & { readonly source: LabSource };

export interface TrendValue {
  readonly setting: TrendSetting;
  readonly points: readonly number[];
}

const TREND_THRESHOLDS = { rounds: LAB_THRESHOLDS.trendRounds, days: LAB_THRESHOLDS.trendDays };

function trendGroup(input: LabInput, rounds: readonly RoundRecordV1[]) {
  const readiness = readinessFor(input, {
    sampleSize: rounds.length,
    have: { rounds: rounds.length, days: new Set(rounds.map((record) => record.localDay)).size },
    thresholds: TREND_THRESHOLDS,
  });
  const latest = rounds.reduce((max, record) => Math.max(max, record.endedAt), 0);
  return { rounds, readiness, latest, ready: hasFigure(readiness) };
}

/**
 * Accuracy for one setting only: mixing settings would read harder rounds as decline.
 * A setting that can draw wins over one with more rounds that cannot, then most rounds, then most recent.
 */
function computeTrend(input: LabInput): MetricResult<TrendValue> {
  const bySetting = new Map<string, RoundRecordV1[]>();
  input.records.forEach((record) => {
    const key = settingKey(record.source, record.config);
    const group = bySetting.get(key);
    if (group) group.push(record);
    else bySetting.set(key, [record]);
  });
  const { rounds, readiness } =
    [...bySetting.values()]
      .map((group) => trendGroup(input, group))
      .sort((a, b) => Number(b.ready) - Number(a.ready) || b.rounds.length - a.rounds.length || b.latest - a.latest)[0] ??
    trendGroup(input, []);

  return measured(readiness, () => {
    const sorted = [...rounds].sort((a, b) => a.endedAt - b.endedAt);
    const { source, config } = sorted[0];
    return {
      setting: { source, pieceCount: config.pieceCount, memorizeSeconds: config.memorizeSeconds },
      points: sorted.slice(-LAB_THRESHOLDS.trendPoints).map((record) => record.accuracy),
    };
  });
}

// Recall by piece type

export interface TypeRecall {
  readonly type: PieceSymbol;
  readonly shown: number;
  readonly recalled: number;
  readonly ready: boolean;
}

export interface TypeRecallValue {
  readonly types: readonly TypeRecall[];
  /** Every round places both kings, so king recall is a baseline, not a finding. */
  readonly king: TypeRecall;
  /** Easy rounds place only the two kings, so more of them never ready another type. */
  readonly onlyKings: boolean;
  /** Rounds until the first type other than the king is ready, at the current rate; null when there is no rate yet. */
  readonly roundsEstimate: number | null;
}

function roundsToReach(threshold: number, have: number, rounds: number): number | null {
  if (have >= threshold) return 0;
  if (rounds === 0 || have === 0) return null;
  return Math.ceil(((threshold - have) * rounds) / have);
}

const TYPE_THRESHOLDS = { exposures: LAB_THRESHOLDS.typeExposures };

function computeTypeRecall(input: LabInput): MetricResult<TypeRecallValue> {
  const { summary } = input;
  const recallOf = (type: PieceSymbol): TypeRecall => {
    const shown = summary.typeShown[type] ?? 0;
    return {
      type,
      shown,
      recalled: shown - (summary.typeMissed[type] ?? 0),
      ready: shown >= TYPE_THRESHOLDS.exposures,
    };
  };
  const types = PIECE_LETTERS.filter((type) => type !== "k").map(recallOf);
  const mostShown = Math.max(...types.map(({ shown }) => shown));
  const readiness = readinessFor(input, { sampleSize: summary.rounds, have: { exposures: mostShown }, thresholds: TYPE_THRESHOLDS });
  return measured(readiness, () => ({
    types,
    king: recallOf("k"),
    onlyKings: mostShown === 0,
    roundsEstimate: roundsToReach(TYPE_THRESHOLDS.exposures, mostShown, summary.rounds),
  }));
}

// Miss map

export interface MissCell {
  readonly shown: number;
  readonly missed: number;
  readonly ready: boolean;
}

export interface MissMapValue {
  readonly view: "squares" | "lines";
  readonly squares: readonly MissCell[];
  readonly files: readonly MissCell[];
  readonly ranks: readonly MissCell[];
  /** Rounds until the thinnest file or rank is ready, at the current rate; null when there is no rate yet. */
  readonly roundsEstimate: number | null;
}

const MISS_THRESHOLDS = { exposures: LAB_THRESHOLDS.squareExposures };

function cell(shown: number, missed: number): MissCell {
  return { shown, missed, ready: shown >= MISS_THRESHOLDS.exposures };
}

function sumLine(values: readonly number[], inLine: (index: number) => boolean): number {
  return values.reduce((sum, value, index) => (inLine(index) ? sum + value : sum), 0);
}

function computeMissMap(input: LabInput): MetricResult<MissMapValue> {
  const { summary } = input;
  const { squareShown, squareMissed } = summary;
  const line = (inLine: (index: number) => boolean) => cell(sumLine(squareShown, inLine), sumLine(squareMissed, inLine));
  const files = Array.from({ length: 8 }, (_, file) => line((index) => index % 8 === file));
  const ranks = Array.from({ length: 8 }, (_, row) => line((index) => Math.floor(index / 8) === row));
  const thinnest = Math.min(...files.map(({ shown }) => shown), ...ranks.map(({ shown }) => shown));
  const readiness = readinessFor(input, { sampleSize: summary.rounds, have: { exposures: thinnest }, thresholds: MISS_THRESHOLDS });
  return measured(readiness, () => {
    const squares = squareShown.map((shown, index) => cell(shown, squareMissed[index]));
    return {
      view: squares.every(({ ready }) => ready) ? "squares" : "lines",
      squares,
      files,
      ranks,
      roundsEstimate: roundsToReach(MISS_THRESHOLDS.exposures, thinnest, summary.rounds),
    };
  });
}

// Registry

interface LabValues {
  readonly streak: StreakValue;
  readonly bests: BestsValue;
  readonly trend: TrendValue;
  readonly typeRecall: TypeRecallValue;
  readonly missMap: MissMapValue;
}

export type MetricId = keyof LabValues;
export type LabResults = { readonly [K in MetricId]: MetricResult<LabValues[K]> };

export const LAB_METRICS: { readonly [K in MetricId]: MetricDef<LabValues[K]> & { readonly id: K } } = {
  streak: {
    id: "streak",
    question: "How many days in a row have you played?",
    thresholds: STREAK_THRESHOLDS,
    compute: computeStreak,
  },
  bests: {
    id: "bests",
    question: "What is your best reading at each setting?",
    thresholds: BESTS_THRESHOLDS,
    compute: computeBests,
  },
  trend: {
    id: "trend",
    question: "Is your accuracy rising at the setting you play most?",
    thresholds: TREND_THRESHOLDS,
    compute: computeTrend,
  },
  typeRecall: {
    id: "typeRecall",
    question: "Which piece types do you recall least often?",
    thresholds: TYPE_THRESHOLDS,
    compute: computeTypeRecall,
  },
  missMap: {
    id: "missMap",
    question: "Which files, ranks and squares do you miss most?",
    thresholds: MISS_THRESHOLDS,
    compute: computeMissMap,
  },
};

const METRIC_IDS = Object.keys(LAB_METRICS) as MetricId[];

/** Every metric's result. Pure, so callers memoise it on the identity of records and summary, and on today. */
export function deriveLab(input: LabInput): LabResults {
  return Object.fromEntries(METRIC_IDS.map((id) => [id, LAB_METRICS[id].compute(input)])) as unknown as LabResults;
}
