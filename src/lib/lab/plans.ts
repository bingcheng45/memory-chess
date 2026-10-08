import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import type { PlanEnding, PlanId, StoredPlan } from "./choices";
import { distinctDays, measured, readinessFor, type LabInput, type MetricResult } from "./engine";
import { EDGE_RIG } from "./insights";
import { daysBetween } from "./readiness";
import { configKey, type RoundConfig, type RoundRecord } from "./record";
import { byEndedAt } from "./sessions";

export type Rung = Pick<RoundConfig, "pieceCount" | "memorizeSeconds">;

export const MEDIUM_RUNG: Rung = { pieceCount: DEFAULT_PRESET.pieceCount, memorizeSeconds: DEFAULT_PRESET.memorizeTime };

export const PLAN_RULES = {
  baseline: { days: 7, rung: MEDIUM_RUNG },
  edge: { days: 14, rung: EDGE_RIG, targetDays: 5, compareRounds: 3, beforeWindow: 30 },
  ladder: { runLength: 3, accuracy: 90, stepSeconds: 2, floorSeconds: 5 },
} as const;

/** Where the plan stands on `today`. `day` counts from 1 on the start day; an ended plan keeps the day it ended on. */
export type PlanStatus =
  | { readonly kind: "active"; readonly day: number }
  | { readonly kind: "done"; readonly day: number; readonly how: "rounds" | "calendar" | "finished" }
  | { readonly kind: "stopped"; readonly day: number };

export type BaselineComparison =
  | { readonly kind: "change"; readonly firstDay: number; readonly first: number; readonly lastDay: number; readonly latest: number; readonly change: number }
  | { readonly kind: "tooFew"; readonly rounds: 0 | 1 };

export interface EdgeSide {
  /** Rounds that showed at least one piece on the a or h file. */
  readonly rounds: number;
  readonly shown: number;
  readonly missed: number;
  /** Whole percent of edge-file pieces missed; null until the side has enough rounds to read. */
  readonly percent: number | null;
}

export type PlanProgress =
  | {
      readonly planId: "baseline";
      readonly status: PlanStatus;
      readonly daysPlayed: number;
      /** Shown from day 7 or once the plan is done, never before. */
      readonly comparison: BaselineComparison | null;
    }
  | {
      readonly planId: "edge";
      readonly status: PlanStatus;
      readonly daysPlayed: number;
      /** Days of the plan so far, up to its 14. */
      readonly daysElapsed: number;
      readonly before: EdgeSide;
      readonly since: EdgeSide;
    }
  | {
      readonly planId: "ladder";
      readonly status: PlanStatus;
      readonly rung: Rung;
      /** Rounds in a row at the rung scoring at least 90, up to 3. */
      readonly run: number;
      readonly climbed: boolean;
      /** Null at the top of the ladder. */
      readonly next: Rung | null;
    };

export type PlansValue = PlanProgress;

/** Rounds from the start day to the day the plan ended, or to today while it runs. */
const sinceStart = (rounds: readonly RoundRecord[], { startedDay, ended }: StoredPlan) =>
  rounds.filter(({ localDay }) => localDay >= startedDay && (!ended || localDay <= ended.day));
const atRung = (rung: Rung) => (record: RoundRecord) => configKey(record.config) === configKey(rung);
const percentOf = (share: number) => Math.round(share * 100);

/** A plan's day count stops on the day it ended, so an ended plan reads the same on every later visit. */
function planDay({ startedDay, ended }: StoredPlan, today: string) {
  return daysBetween(startedDay, ended?.day ?? today) + 1;
}

type Completion = { readonly how: "rounds" | "calendar"; readonly day: number } | null;

function statusOf(plan: StoredPlan, today: string, completed: Completion): PlanStatus {
  const how: PlanEnding | undefined = plan.ended?.how;
  if (how === "stopped") return { kind: "stopped", day: planDay(plan, today) };
  if (how === "finished") return { kind: "done", day: planDay(plan, today), how: "finished" };
  return completed ? { kind: "done", ...completed } : { kind: "active", day: planDay(plan, today) };
}

function baseline(plan: StoredPlan, records: readonly RoundRecord[], today: string): PlanProgress {
  const { days, rung } = PLAN_RULES.baseline;
  const dayOf = (record: RoundRecord) => daysBetween(plan.startedDay, record.localDay) + 1;
  const all = byEndedAt(sinceStart(records, plan).filter(atRung(rung)));
  const lastDay = [...new Set(all.map(({ localDay }) => localDay))][days - 1];
  // Rounds after the seventh day played are past the plan, so a finished week reads the same later.
  const rounds = lastDay === undefined ? all : all.filter(({ localDay }) => localDay <= lastDay);
  const daysPlayed = distinctDays(rounds);
  const status = statusOf(plan, today, lastDay === undefined ? null : { how: "rounds", day: daysBetween(plan.startedDay, lastDay) + 1 });
  const first = rounds[0];
  const last = rounds.at(-1);
  const comparison: BaselineComparison | null =
    status.kind !== "done" && status.day < days
      ? null
      : !first || !last || first === last
        ? { kind: "tooFew", rounds: rounds.length === 0 ? 0 : 1 }
        : {
            kind: "change",
            firstDay: dayOf(first),
            first: Math.round(first.accuracy),
            lastDay: dayOf(last),
            latest: Math.round(last.accuracy),
            change: Math.round(last.accuracy) - Math.round(first.accuracy),
          };
  return { planId: "baseline", status, daysPlayed, comparison };
}

const EDGE_FILE = /^[ah]$/;
const isEdgeIndex = (index: number) => EDGE_FILE.test("abcdefgh"[index % 8]);

function edgeSide(rounds: readonly RoundRecord[]): EdgeSide {
  const counted = rounds.map((record) => {
    const edge = [...record.squares].filter((outcome, index) => isEdgeIndex(index) && outcome !== "." && outcome !== "x");
    return { shown: edge.length, missed: edge.filter((outcome) => outcome === "m" || outcome === "w").length };
  }).filter(({ shown }) => shown > 0);
  const shown = counted.reduce((sum, round) => sum + round.shown, 0);
  const missed = counted.reduce((sum, round) => sum + round.missed, 0);
  const readable = counted.length >= PLAN_RULES.edge.compareRounds;
  return { rounds: counted.length, shown, missed, percent: readable ? percentOf(missed / shown) : null };
}

function edge(plan: StoredPlan, records: readonly RoundRecord[], today: string): PlanProgress {
  const { days, rung, beforeWindow } = PLAN_RULES.edge;
  const since = sinceStart(records, plan);
  const before = byEndedAt(records.filter(({ localDay }) => localDay < plan.startedDay)).slice(-beforeWindow);
  const day = planDay(plan, today);
  return {
    planId: "edge",
    status: statusOf(plan, today, day > days ? { how: "calendar", day: days } : null),
    daysPlayed: distinctDays(since.filter(atRung(rung))),
    daysElapsed: Math.min(day, days),
    before: edgeSide(before),
    since: edgeSide(since),
  };
}

/**
 * Study time drops 2 s a rung down to the 5 s floor; from the floor the next rung adds a piece and goes back to the
 * study time the ladder started at. Null past the largest board.
 */
export function nextRung(rung: Rung, startSeconds: number): Rung | null {
  const { stepSeconds, floorSeconds } = PLAN_RULES.ladder;
  if (rung.memorizeSeconds > floorSeconds) {
    return { pieceCount: rung.pieceCount, memorizeSeconds: Math.max(floorSeconds, rung.memorizeSeconds - stepSeconds) };
  }
  if (rung.pieceCount >= PIECE_COUNT_RANGE.max) return null;
  return { pieceCount: rung.pieceCount + 1, memorizeSeconds: Math.max(floorSeconds, startSeconds) };
}

export interface RungClimb {
  /** The round that made three in a row. */
  readonly record: RoundRecord;
  readonly from: Rung;
  readonly next: Rung | null;
}

const rungOf = ({ config: { pieceCount, memorizeSeconds } }: RoundRecord): Rung => ({ pieceCount, memorizeSeconds });

/** Game rounds since the start, oldest first. Practice rounds sit at one fixed setting, so they are not on the ladder. */
const ladderRounds = (records: readonly RoundRecord[], plan: StoredPlan) => byEndedAt(sinceStart(records, plan).filter(({ source }) => source === "game"));

/**
 * Each rung climbs once per plan: the first time three rounds in a row at it score 90 or better. `run` is the rounds in
 * a row at the latest round's setting, up to three.
 */
export function ladderClimbs(records: readonly RoundRecord[], plan: StoredPlan): { climbs: RungClimb[]; run: number } {
  const { runLength, accuracy } = PLAN_RULES.ladder;
  const rounds = ladderRounds(records, plan);
  const startSeconds = rounds[0]?.config.memorizeSeconds ?? MEDIUM_RUNG.memorizeSeconds;
  const climbed = new Set<string>();
  const climbs: RungClimb[] = [];
  let run = 0;
  rounds.forEach((record, index) => {
    const key = configKey(record.config);
    const sameRung = index > 0 && configKey(rounds[index - 1].config) === key;
    run = record.accuracy >= accuracy ? (sameRung ? run : 0) + 1 : 0;
    if (run < runLength || climbed.has(key)) return;
    climbed.add(key);
    climbs.push({ record, from: rungOf(record), next: nextRung(rungOf(record), startSeconds) });
  });
  return { climbs, run: Math.min(run, runLength) };
}

/** The rung is the latest game setting: since the start, else before it, else Medium. */
function ladder(plan: StoredPlan, records: readonly RoundRecord[], today: string): PlanProgress {
  const rounds = ladderRounds(records, plan);
  const earlier = byEndedAt(records.filter(({ source, localDay }) => source === "game" && localDay < plan.startedDay));
  const latest = rounds.at(-1) ?? earlier.at(-1);
  const rung = latest ? rungOf(latest) : MEDIUM_RUNG;
  const { climbs, run } = ladderClimbs(records, plan);
  const climb = climbs.find(({ from }) => configKey(from) === configKey(rung));
  return {
    planId: "ladder",
    status: statusOf(plan, today, null),
    rung,
    run,
    climbed: climb !== undefined,
    next: climb ? climb.next : nextRung(rung, rounds[0]?.config.memorizeSeconds ?? rung.memorizeSeconds),
  };
}

/** The setting a plan opens on: Medium, the edge rig, or the ladder's current rung. */
export function startRung(planId: PlanId, records: readonly RoundRecord[]): Rung {
  if (planId !== "ladder") return PLAN_RULES[planId].rung;
  const latest = byEndedAt(records.filter(({ source }) => source === "game")).at(-1);
  return latest ? rungOf(latest) : MEDIUM_RUNG;
}

const PLANS: { readonly [K in PlanId]: (plan: StoredPlan, records: readonly RoundRecord[], today: string) => PlanProgress } = { baseline, edge, ladder };

/** The rounds a plan counts, which is its sample: the plan's own rig for the two fixed plans, every game round for the ladder. */
function planRounds(plan: StoredPlan, records: readonly RoundRecord[]): number {
  if (plan.planId === "ladder") return ladderRounds(records, plan).length;
  return sinceStart(records, plan).filter(atRung(PLAN_RULES[plan.planId].rung)).length;
}

export const PLANS_THRESHOLDS = {};

/** Empty with no plan chosen; a chosen plan is ready from its first day, since a plan with no rounds yet is still news. */
export function computePlans(input: LabInput): MetricResult<PlansValue> {
  const { plan = null, records, today } = input;
  const readiness = readinessFor(input, {
    sampleSize: plan ? planRounds(plan, records) : 0,
    played: plan ? 1 : 0,
    have: {},
    thresholds: PLANS_THRESHOLDS,
  });
  return measured(readiness, () => PLANS[(plan as StoredPlan).planId](plan as StoredPlan, records, today));
}
