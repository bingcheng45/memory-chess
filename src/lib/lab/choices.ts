import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import type { RoundRecord } from "./record";
import { isCalendarDay, isObject } from "./transfer";

/**
 * What the player chose, as opposed to what they did: one plan and one goal, kept on this device apart from the round
 * log and its export. Progress is never stored; the engine derives it from rounds on or after the chosen day.
 */
export const PLAN_KEY = "memory-chess-lab-plan";
export const TARGET_KEY = "memory-chess-lab-target";

export const PLAN_IDS = ["baseline", "edge", "ladder"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_ENDINGS = ["stopped", "finished"] as const;
export type PlanEnding = (typeof PLAN_ENDINGS)[number];

export interface StoredPlan {
  readonly planId: PlanId;
  readonly startedDay: string;
  /** Milliseconds; absent on a plan stored before it was kept, which then counts from the start of its day. */
  readonly startedAt?: number;
  /** Set when the player stops the plan or finishes it early. A plan its rounds or its calendar complete needs no mark. */
  readonly ended?: { readonly how: PlanEnding; readonly day: string };
}

export const GOAL_PIECES = { min: 3, max: PIECE_COUNT_RANGE.max } as const;
export const GOAL_ACCURACY = { min: 60, max: 100, step: 5 } as const;

export interface StoredTarget {
  readonly pieceCount: number;
  readonly accuracy: number;
  readonly createdDay: string;
  /** Milliseconds; absent on a goal stored before it was kept, which then counts from the start of its day. */
  readonly createdAt?: number;
}

function parseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Rounds from the moment of a choice on, or from the start of its day for a choice stored without the moment. */
export const playedSince =
  (day: string, at: number | undefined) =>
  ({ localDay, endedAt }: RoundRecord): boolean =>
    at === undefined ? localDay >= day : endedAt >= at;

const isTime = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

/** Anything this version did not write reads as no plan, so a damaged value never breaks the record. */
export function parsePlan(text: string | null): StoredPlan | null {
  const raw = parseJson(text);
  if (!isObject(raw) || !PLAN_IDS.includes(raw.planId as PlanId) || !isCalendarDay(raw.startedDay)) return null;
  if (raw.startedAt !== undefined && !isTime(raw.startedAt)) return null;
  const started: StoredPlan = { planId: raw.planId as PlanId, startedDay: raw.startedDay };
  const plan = raw.startedAt === undefined ? started : { ...started, startedAt: raw.startedAt };
  if (raw.ended === undefined) return plan;
  const { ended } = raw;
  if (!isObject(ended) || !PLAN_ENDINGS.includes(ended.how as PlanEnding) || !isCalendarDay(ended.day) || ended.day < plan.startedDay) return null;
  return { ...plan, ended: { how: ended.how as PlanEnding, day: ended.day } };
}

const range = (min: number, max: number, step = 1) => Array.from({ length: (max - min) / step + 1 }, (_, index) => min + index * step);
/** The goal form's options, and the only values a stored goal may hold. */
export const GOAL_PIECE_OPTIONS: readonly number[] = range(GOAL_PIECES.min, GOAL_PIECES.max);
export const GOAL_ACCURACY_OPTIONS: readonly number[] = range(GOAL_ACCURACY.min, GOAL_ACCURACY.max, GOAL_ACCURACY.step);

export function parseTarget(text: string | null): StoredTarget | null {
  const raw = parseJson(text);
  if (!isObject(raw) || !GOAL_PIECE_OPTIONS.includes(raw.pieceCount as number) || !GOAL_ACCURACY_OPTIONS.includes(raw.accuracy as number)) return null;
  if (!isCalendarDay(raw.createdDay) || (raw.createdAt !== undefined && !isTime(raw.createdAt))) return null;
  const target: StoredTarget = { pieceCount: raw.pieceCount as number, accuracy: raw.accuracy as number, createdDay: raw.createdDay };
  return raw.createdAt === undefined ? target : { ...target, createdAt: raw.createdAt };
}
