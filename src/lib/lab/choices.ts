import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { isCalendarDay } from "./transfer";

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
  /** Set when the player stops the plan or finishes it early. A plan its rounds or its calendar complete needs no mark. */
  readonly ended?: { readonly how: PlanEnding; readonly day: string };
}

export const GOAL_PIECES = { min: 3, max: PIECE_COUNT_RANGE.max } as const;
export const GOAL_ACCURACY = { min: 60, max: 100, step: 5 } as const;

export interface StoredTarget {
  readonly pieceCount: number;
  readonly accuracy: number;
  readonly createdDay: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function parseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Anything this version did not write reads as no plan, so a damaged value never breaks the record. */
export function parsePlan(text: string | null): StoredPlan | null {
  const raw = parseJson(text);
  if (!isObject(raw) || !PLAN_IDS.includes(raw.planId as PlanId) || !isCalendarDay(raw.startedDay)) return null;
  const plan: StoredPlan = { planId: raw.planId as PlanId, startedDay: raw.startedDay };
  if (raw.ended === undefined) return plan;
  const { ended } = raw;
  if (!isObject(ended) || !PLAN_ENDINGS.includes(ended.how as PlanEnding) || !isCalendarDay(ended.day) || ended.day < plan.startedDay) return null;
  return { ...plan, ended: { how: ended.how as PlanEnding, day: ended.day } };
}

export const isGoalPieces = (value: number) => Number.isInteger(value) && value >= GOAL_PIECES.min && value <= GOAL_PIECES.max;
export const isGoalAccuracy = (value: number) =>
  Number.isInteger(value) && value >= GOAL_ACCURACY.min && value <= GOAL_ACCURACY.max && value % GOAL_ACCURACY.step === 0;

export function parseTarget(text: string | null): StoredTarget | null {
  const raw = parseJson(text);
  if (!isObject(raw) || typeof raw.pieceCount !== "number" || typeof raw.accuracy !== "number") return null;
  if (!isGoalPieces(raw.pieceCount) || !isGoalAccuracy(raw.accuracy) || !isCalendarDay(raw.createdDay)) return null;
  return { pieceCount: raw.pieceCount, accuracy: raw.accuracy, createdDay: raw.createdDay };
}
