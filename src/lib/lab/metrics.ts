import type { PieceSymbol } from "chess.js";
import {
  busiestSetting,
  countsForTrend,
  hundredths,
  mean,
  measured,
  readinessFor,
  settingOf,
  shiftDay,
  type LabInput,
  TREND_THRESHOLDS,
  type MetricResult,
  type TrendSetting,
} from "./engine";
import {
  computePiecesHeld,
  computeSessions,
  computeSpan,
  computeSpeed,
  PIECES_THRESHOLDS,
  SESSIONS_THRESHOLDS,
  SPAN_THRESHOLDS,
  SPEED_THRESHOLDS,
  type PiecesHeldValue,
  type SessionsValue,
  type SpanValue,
  type SpeedValue,
} from "./progress";
import { LAB_THRESHOLDS, type Need } from "./readiness";
import { LAB_SOURCES, PIECE_LETTERS, settingKey, type LabSource, type RoundRecord } from "./record";
import { sessionRuns } from "./sessions";
import type { PersonalBest } from "./summary";

export interface MetricDef<TValue> {
  readonly id: MetricId;
  readonly question: string;
  /**
   * Compared with the measure the metric names, not with every cell: typeRecall's exposures with the most-shown type
   * other than the king, missMap's with the thinnest file or rank. Single cells carry their own `ready`.
   */
  readonly thresholds: Need;
  compute(input: LabInput): MetricResult<TValue>;
}

export type StreakDay = "played" | "missed" | "today";

export interface StreakValue {
  /** Consecutive days played, ending today, or yesterday if today has no round yet. */
  readonly current: number;
  readonly longest: number;
  readonly window: readonly StreakDay[];
}

function run(played: ReadonlySet<string>, day: string, step: -1 | 1): number {
  let length = 0;
  while (played.has(shiftDay(day, step * length))) length += 1;
  return length;
}

const STREAK_THRESHOLDS = { days: LAB_THRESHOLDS.streakDays };

function computeStreak(input: LabInput): MetricResult<StreakValue> {
  const { summary: { rounds, days }, today } = input;
  const readiness = readinessFor(input, { sampleSize: rounds, have: { days: days.length }, thresholds: STREAK_THRESHOLDS });
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
  const bests = Object.entries(summary.bests);
  const sampleSize = bests.length === 0 ? 0 : summary.rounds;
  const readiness = readinessFor(input, { sampleSize, have: { rounds: summary.rounds }, thresholds: BESTS_THRESHOLDS });
  return measured(readiness, () => ({
    entries: bests
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

export interface TrendValue {
  readonly setting: TrendSetting;
  /** Accuracy of each of the last 30 rounds at the setting, oldest first. */
  readonly points: readonly number[];
  /** Mean accuracy of the setting's rounds in each of the last 30 sessions that had one, oldest first. */
  readonly bySession: readonly number[];
  /** Session points once there are enough of them to read as a line, round points before. */
  readonly granularity: "round" | "session";
}

/** Sessions are sittings over every round, so a setting's rounds stay in one session when other settings are played between them. */
function sessionAccuracy(records: readonly RoundRecord[], { source, pieceCount, memorizeSeconds }: TrendSetting): number[] {
  const key = settingKey(source, { pieceCount, memorizeSeconds });
  return sessionRuns(records).flatMap((run) => {
    const accuracies = run.filter((record) => settingKey(record.source, record.config) === key).map(({ accuracy }) => accuracy);
    return accuracies.length === 0 ? [] : [hundredths(mean(accuracies))];
  });
}

function computeTrend(input: LabInput): MetricResult<TrendValue> {
  const records = input.records.filter(countsForTrend);
  const { rounds, readiness } = busiestSetting(input, records, TREND_THRESHOLDS);

  return measured(readiness, () => {
    const setting = settingOf(rounds[0]);
    const bySession = sessionAccuracy(records, setting);
    const bySessions = rounds.length >= LAB_THRESHOLDS.sessionTrendRounds && bySession.length >= LAB_THRESHOLDS.sessionTrendSessions;
    return {
      setting,
      points: rounds.slice(-LAB_THRESHOLDS.trendPoints).map((record) => record.accuracy),
      bySession: bySession.slice(-LAB_THRESHOLDS.trendPoints),
      granularity: bySessions ? "session" : "round",
    };
  });
}

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

interface LabValues {
  readonly streak: StreakValue;
  readonly bests: BestsValue;
  readonly trend: TrendValue;
  readonly typeRecall: TypeRecallValue;
  readonly missMap: MissMapValue;
  readonly sessions: SessionsValue;
  readonly span: SpanValue;
  readonly piecesHeld: PiecesHeldValue;
  readonly speed: SpeedValue;
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
  sessions: {
    id: "sessions",
    question: "When did you sit down to play, and for how many rounds?",
    thresholds: SESSIONS_THRESHOLDS,
    compute: computeSessions,
  },
  span: {
    id: "span",
    question: "How many pieces can you hold at your usual study time?",
    thresholds: SPAN_THRESHOLDS,
    compute: computeSpan,
  },
  piecesHeld: {
    id: "piecesHeld",
    question: "Are you placing more pieces right, whatever the setting?",
    thresholds: PIECES_THRESHOLDS,
    compute: computePiecesHeld,
  },
  speed: {
    id: "speed",
    question: "Are you rebuilding faster at the setting you play most, without losing accuracy?",
    thresholds: SPEED_THRESHOLDS,
    compute: computeSpeed,
  },
};

const METRIC_IDS = Object.keys(LAB_METRICS) as MetricId[];

/** Every metric's result. Pure, so callers memoise it on the identity of records and summary, and on today. */
export function deriveLab(input: LabInput): LabResults {
  return Object.fromEntries(METRIC_IDS.map((id) => [id, LAB_METRICS[id].compute(input)])) as unknown as LabResults;
}
