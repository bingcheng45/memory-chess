import type { StoredTarget } from "./choices";
import { measured, readinessFor, type LabInput, type MetricResult } from "./engine";
import type { RoundRecord } from "./record";
import { byEndedAt } from "./sessions";

export interface GoalRound {
  readonly at: number;
  readonly localDay: string;
  readonly pieceCount: number;
  readonly accuracy: number;
}

export interface GoalValue {
  readonly target: StoredTarget;
  /** The most accurate round at the goal's piece count or more since the goal was set, the earliest of any tie. */
  readonly best: GoalRound | null;
  /** Best accuracy as a whole percent of the goal's accuracy, up to 100. */
  readonly percent: number;
  /** The first round at the piece count or more that met the accuracy. */
  readonly reached: GoalRound | null;
}

export const GOAL_THRESHOLDS = { rounds: 1 };

const goalRound = ({ endedAt, localDay, config, accuracy }: RoundRecord): GoalRound => ({
  at: endedAt,
  localDay,
  pieceCount: config.pieceCount,
  accuracy: Math.round(accuracy),
});

/** Rounds at the goal's piece count or more since the day it was set, practice and games alike, oldest first. */
export function goalRounds(records: readonly RoundRecord[], { pieceCount, createdDay }: StoredTarget): RoundRecord[] {
  return byEndedAt(records.filter(({ localDay, config }) => localDay >= createdDay && config.pieceCount >= pieceCount));
}

/** Empty with no goal set, so the panel shows its sample; warming until a round at the goal's piece count or more has been played since. */
export function computeGoal(input: LabInput): MetricResult<GoalValue> {
  const { target = null, records } = input;
  const rounds = target ? goalRounds(records, target) : [];
  const readiness = readinessFor(input, {
    sampleSize: rounds.length,
    played: target ? 1 : 0,
    have: { rounds: rounds.length },
    thresholds: GOAL_THRESHOLDS,
  });
  return measured(readiness, () => {
    const goal = target as StoredTarget;
    const best = rounds.reduce<RoundRecord | null>((top, round) => (top === null || round.accuracy > top.accuracy ? round : top), null);
    const reached = rounds.find(({ accuracy }) => Math.round(accuracy) >= goal.accuracy);
    return {
      target: goal,
      best: best && goalRound(best),
      percent: best ? Math.min(100, Math.round((Math.round(best.accuracy) / goal.accuracy) * 100)) : 0,
      reached: reached ? goalRound(reached) : null,
    };
  });
}
