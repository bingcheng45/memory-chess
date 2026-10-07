import {
  busiestSetting,
  countsForTrend,
  distinctDays,
  hundredths,
  mean,
  measured,
  readinessFor,
  settingOf,
  shiftDay,
  TREND_THRESHOLDS,
  type LabInput,
  type MetricResult,
  type TrendSetting,
} from "./engine";
import { LAB_THRESHOLDS } from "./readiness";
import type { RoundRecord } from "./record";
import { byEndedAt, sessionRuns, sessionsOf, type Session } from "./sessions";

const trendRounds = (input: LabInput) => byEndedAt(input.records.filter(countsForTrend));

export interface RecentChange {
  /** Mean of the last 10 rounds, or of every round when there are fewer. */
  readonly average: number;
  /** Mean of the 10 rounds before those; null until there are 20. */
  readonly previous: number | null;
  readonly change: number | null;
}

function recentChange(values: readonly number[]): RecentChange {
  const { rollingWindow } = LAB_THRESHOLDS;
  const average = mean(values.slice(-rollingWindow));
  const earlier = values.slice(-2 * rollingWindow, -rollingWindow);
  const previous = earlier.length === rollingWindow ? mean(earlier) : null;
  return {
    average: hundredths(average),
    previous: previous === null ? null : hundredths(previous),
    change: previous === null ? null : hundredths(average - previous),
  };
}

export interface SessionsValue {
  readonly sessions: readonly Session[];
}

export const SESSIONS_THRESHOLDS = { rounds: 1 };

export function computeSessions(input: LabInput): MetricResult<SessionsValue> {
  const { records } = input;
  const readiness = readinessFor(input, { sampleSize: records.length, have: { rounds: records.length }, thresholds: SESSIONS_THRESHOLDS });
  return measured(readiness, () => ({ sessions: sessionsOf(records) }));
}

export interface SpanStep {
  /** When the session ended. */
  readonly endedAt: number;
  /** The span after that session; null until a piece count first qualifies. */
  readonly pieceCount: number | null;
}

export interface SpanValue {
  /** The largest qualifying piece count; null while warming. */
  readonly pieceCount: number | null;
  /** The usual study time every round here was played at. */
  readonly memorizeSeconds: number;
  /** Rounds at 80% or better at the span's piece count and study time. */
  readonly qualifyingRounds: number;
  readonly history: readonly SpanStep[];
  /** The span from rounds played up to 7 days before today, at the same study time; null when there was none. */
  readonly weekAgo: number | null;
  readonly change: number | null;
}

export const SPAN_THRESHOLDS = { qualifyingRounds: LAB_THRESHOLDS.spanRounds };

/** The study time played most in the last 20 rounds; a tie goes to the one played most recently. */
function usualStudyTime(rounds: readonly RoundRecord[]): number {
  const counts = new Map<number, number>();
  rounds
    .slice(-LAB_THRESHOLDS.usualTimeRounds)
    .reverse()
    .forEach(({ config }) => counts.set(config.memorizeSeconds, (counts.get(config.memorizeSeconds) ?? 0) + 1));
  return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

type QualifyingCounts = Map<number, number>;

/** Counts are keyed by piece count. The caller folds rounds in one at a time, so the history needs one pass. */
function addQualifying(counts: QualifyingCounts, { accuracy, config: { pieceCount } }: RoundRecord): QualifyingCounts {
  if (accuracy >= LAB_THRESHOLDS.spanAccuracy) counts.set(pieceCount, (counts.get(pieceCount) ?? 0) + 1);
  return counts;
}

function spanOf(counts: QualifyingCounts): number | null {
  const held = [...counts].filter(([, count]) => count >= LAB_THRESHOLDS.spanRounds).map(([pieceCount]) => pieceCount);
  return held.length === 0 ? null : Math.max(...held);
}

const countQualifying = (rounds: readonly RoundRecord[]) => rounds.reduce(addQualifying, new Map());

export function computeSpan(input: LabInput): MetricResult<SpanValue> {
  const rounds = trendRounds(input);
  const memorizeSeconds = rounds.length === 0 ? 0 : usualStudyTime(rounds);
  const atTime = (record: RoundRecord) => record.config.memorizeSeconds === memorizeSeconds;
  const timed = rounds.filter(atTime);
  const counts = countQualifying(timed);
  const readiness = readinessFor(input, {
    sampleSize: timed.length,
    have: { qualifyingRounds: Math.max(0, ...counts.values()) },
    thresholds: SPAN_THRESHOLDS,
  });

  return measured(readiness, () => {
    const running: QualifyingCounts = new Map();
    const history = sessionRuns(rounds).map((run) => {
      run.filter(atTime).forEach((record) => addQualifying(running, record));
      return { endedAt: run[run.length - 1].endedAt, pieceCount: spanOf(running) };
    });
    const cutoff = input.today === "" ? null : shiftDay(input.today, -7);
    const weekAgo = cutoff === null ? null : spanOf(countQualifying(timed.filter(({ localDay }) => localDay <= cutoff)));
    const pieceCount = spanOf(counts);
    return {
      pieceCount,
      memorizeSeconds,
      qualifyingRounds: pieceCount === null ? 0 : (counts.get(pieceCount) ?? 0),
      history,
      weekAgo,
      change: pieceCount !== null && weekAgo !== null ? pieceCount - weekAgo : null,
    };
  });
}

export interface PiecesHeldValue {
  /** Correct pieces in each of the last 30 rounds, oldest first, at any setting. */
  readonly points: readonly number[];
  /** For each point, the mean of that round and the four before it. */
  readonly movingAverage: readonly number[];
  readonly recent: RecentChange;
}

export const PIECES_THRESHOLDS = TREND_THRESHOLDS;

/** Correct pieces, unlike accuracy, does not fall when a player moves up to a harder setting. */
export function computePiecesHeld(input: LabInput): MetricResult<PiecesHeldValue> {
  const rounds = trendRounds(input);
  const readiness = readinessFor(input, {
    sampleSize: rounds.length,
    have: { rounds: rounds.length, days: distinctDays(rounds) },
    thresholds: PIECES_THRESHOLDS,
  });

  return measured(readiness, () => {
    const correct = rounds.map((record) => record.correct);
    const from = Math.max(0, correct.length - LAB_THRESHOLDS.trendPoints);
    return {
      points: correct.slice(from),
      movingAverage: correct
        .slice(from)
        .map((_, index) => hundredths(mean(correct.slice(Math.max(0, from + index + 1 - LAB_THRESHOLDS.movingAverage), from + index + 1)))),
      recent: recentChange(correct),
    };
  });
}

export interface SpeedValue {
  readonly setting: TrendSetting;
  /** Rebuild seconds per correct piece in each of the last 30 rounds at the setting, oldest first. */
  readonly points: readonly number[];
  readonly recent: RecentChange;
  /** The same rounds' accuracy, since a faster rebuild that places fewer pieces right is not progress. */
  readonly accuracyAtSameRounds: { readonly points: readonly number[]; readonly recent: RecentChange };
}

export const SPEED_THRESHOLDS = { rounds: LAB_THRESHOLDS.trendRounds };

const secondsPerPiece = ({ solveMs, correct }: RoundRecord) => solveMs / correct / 1000;

/** Rounds with nothing correct have no time per piece, so they are left out. */
export function computeSpeed(input: LabInput): MetricResult<SpeedValue> {
  const { rounds, readiness } = busiestSetting(input, trendRounds(input).filter(({ correct }) => correct > 0), SPEED_THRESHOLDS);

  return measured(readiness, () => {
    const shown = rounds.slice(-Math.max(LAB_THRESHOLDS.trendPoints, 2 * LAB_THRESHOLDS.rollingWindow));
    const perPiece = shown.map(secondsPerPiece);
    const accuracy = shown.map((record) => record.accuracy);
    return {
      setting: settingOf(rounds[0]),
      points: perPiece.slice(-LAB_THRESHOLDS.trendPoints).map(hundredths),
      recent: recentChange(perPiece),
      accuracyAtSameRounds: { points: accuracy.slice(-LAB_THRESHOLDS.trendPoints), recent: recentChange(accuracy) },
    };
  });
}
