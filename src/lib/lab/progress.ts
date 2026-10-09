/**
 * Progress metrics over the round log. Practice and game rounds count alike: the same generator builds their positions
 * and the same scoring reads them.
 */
import {
  busiestSetting,
  distinctDays,
  hundredths,
  mean,
  measured,
  readinessFor,
  settingOf,
  TREND_THRESHOLDS,
  type LabInput,
  type MetricResult,
  type TrendSetting,
} from "./engine";
import { DAY_MS, LAB_THRESHOLDS } from "./readiness";
import { isFreshReading, type RoundRecord } from "./record";
import { byEndedAt, sessionRuns, sessionsOf, type Session } from "./sessions";

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
  readonly endedAt: number;
  /** The span after that session; null until a piece count first qualifies. Counts only grow, so steps never go down. */
  readonly pieceCount: number | null;
}

export interface SpanValue {
  /** The largest piece count, three or more, with 2 rounds at 80% or better at any study time; null while warming. */
  readonly pieceCount: number | null;
  /** The shortest study time among the qualifying rounds at that piece count; null while warming. */
  readonly memorizeSeconds: number | null;
  /** Rounds at 80% or better at the span's piece count, at every study time. */
  readonly qualifyingRounds: number;
  readonly history: readonly SpanStep[];
  /** The span from rounds ending more than 7 days before the newest round; null when there was none. */
  readonly weekAgo: number | null;
  readonly change: number | null;
}

export const SPAN_THRESHOLDS = { qualifyingRounds: LAB_THRESHOLDS.spanRounds };
/** Rounds of only the two kings never qualify, so a player with nothing else first needs one larger round. */
const LARGER_THRESHOLDS = { largerRounds: 1 };
const WEEK_MS = 7 * DAY_MS;

const isLarger = ({ config }: RoundRecord) => config.pieceCount >= LAB_THRESHOLDS.spanMinPieces;
const qualifies = (record: RoundRecord) => isFreshReading(record) && isLarger(record) && record.accuracy >= LAB_THRESHOLDS.spanAccuracy;

type QualifyingCounts = Map<number, number>;

/** Mutates and returns `counts`, so the history folds every round once instead of recounting per session. */
function addQualifying(counts: QualifyingCounts, record: RoundRecord): QualifyingCounts {
  if (qualifies(record)) counts.set(record.config.pieceCount, (counts.get(record.config.pieceCount) ?? 0) + 1);
  return counts;
}

function spanOf(counts: QualifyingCounts): number | null {
  const held = [...counts].filter(([, count]) => count >= LAB_THRESHOLDS.spanRounds).map(([pieceCount]) => pieceCount);
  return held.length === 0 ? null : Math.max(...held);
}

const countQualifying = (rounds: readonly RoundRecord[]) => rounds.reduce(addQualifying, new Map());

/** The span the span panel prints for these rounds, null until a piece count qualifies. */
export const spanOfRounds = (rounds: readonly RoundRecord[]) => spanOf(countQualifying(rounds));

export function computeSpan(input: LabInput): MetricResult<SpanValue> {
  const rounds = byEndedAt(input.records);
  const counts = countQualifying(rounds);
  const larger = rounds.filter(isLarger).length;
  const readiness = readinessFor(input, {
    sampleSize: rounds.length,
    have: { largerRounds: larger, qualifyingRounds: Math.max(0, ...counts.values()) },
    thresholds: larger === 0 ? LARGER_THRESHOLDS : SPAN_THRESHOLDS,
  });

  return measured(readiness, () => {
    const running: QualifyingCounts = new Map();
    const history = sessionRuns(rounds).map((run) => {
      run.forEach((record) => addQualifying(running, record));
      return { endedAt: run[run.length - 1].endedAt, pieceCount: spanOf(running) };
    });
    const weekBefore = rounds[rounds.length - 1].endedAt - WEEK_MS;
    const weekAgo = spanOfRounds(rounds.filter(({ endedAt }) => endedAt < weekBefore));
    const pieceCount = spanOf(counts);
    const shortestAt = (held: number) =>
      Math.min(...rounds.filter((record) => qualifies(record) && record.config.pieceCount === held).map(({ config }) => config.memorizeSeconds));
    return {
      pieceCount,
      memorizeSeconds: pieceCount === null ? null : shortestAt(pieceCount),
      qualifyingRounds: pieceCount === null ? 0 : (counts.get(pieceCount) ?? 0),
      history,
      weekAgo,
      change: pieceCount !== null && weekAgo !== null ? pieceCount - weekAgo : null,
    };
  });
}

export interface MovingAveragePoint {
  readonly value: number;
  /** True at the start of a player's series, where fewer than five rounds came before to average. */
  readonly partial: boolean;
}

export interface PiecesHeldValue {
  /** Correct pieces in each of the last 30 rounds, oldest first, at any setting. */
  readonly points: readonly number[];
  /** For each point, the mean of that round and the four before it. */
  readonly movingAverage: readonly MovingAveragePoint[];
  readonly recent: RecentChange;
}

export const PIECES_THRESHOLDS = TREND_THRESHOLDS;

/** Correct pieces, unlike accuracy, does not fall when a player moves up to a harder setting. */
export function computePiecesHeld(input: LabInput): MetricResult<PiecesHeldValue> {
  const rounds = byEndedAt(input.records);
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
      movingAverage: correct.slice(from).map((_, index) => {
        const window = correct.slice(Math.max(0, from + index + 1 - LAB_THRESHOLDS.movingAverage), from + index + 1);
        return { value: hundredths(mean(window)), partial: window.length < LAB_THRESHOLDS.movingAverage };
      }),
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

/** A rebuild longer than this was a board left open, so it counts as this long and cannot swamp the average. */
const MAX_SOLVE_MS = 600_000;

const secondsPerPiece = ({ solveMs, correct }: RoundRecord) => Math.min(solveMs, MAX_SOLVE_MS) / correct / 1000;

const RIGHT_THRESHOLDS = { rightRounds: 1 };

/**
 * Rounds with nothing correct or no rebuild time have no time per piece, so they are left out. A player whose every
 * round is left out is warming, not empty, and has no setting to name yet, so the value stays null.
 */
export function computeSpeed(input: LabInput): MetricResult<SpeedValue> {
  const usable = byEndedAt(input.records).filter(({ correct, solveMs }) => correct > 0 && solveMs > 0);
  if (usable.length === 0) {
    const readiness = readinessFor(input, { sampleSize: 0, played: input.records.length, have: { rightRounds: 0 }, thresholds: RIGHT_THRESHOLDS });
    return { readiness, value: null };
  }
  const { rounds, readiness } = busiestSetting(input, usable, SPEED_THRESHOLDS, LAB_THRESHOLDS.speedSettingRounds);

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
