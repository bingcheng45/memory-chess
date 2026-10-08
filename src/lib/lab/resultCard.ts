import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { mean } from "./engine";
import type { Insight } from "./insights";
import type { LabResults } from "./metrics";
import { spanOfRounds } from "./progress";
import { settingKey, type RoundConfig, type RoundRecord } from "./record";
import { byEndedAt } from "./sessions";
import { beats, type LabSummary } from "./summary";
import { weekProgress, type WeekGoal } from "./week";

export type Setting = Pick<RoundConfig, "pieceCount" | "memorizeSeconds">;

export interface NewBest {
  readonly setting: Setting;
  readonly accuracy: number;
  /** The best before this round; null when rounds at the setting have left the log, so the old best is not known. */
  readonly previousAccuracy: number | null;
  /** Seconds saved on the rebuild when the accuracy only matched the old best; null when the accuracy rose. */
  readonly fasterBy: number | null;
}

export interface VsRecent {
  /** This round's accuracy minus the mean of `rounds` earlier rounds at the same setting, in whole points. */
  readonly points: number;
  readonly rounds: number;
}

export interface SpanChange {
  readonly to: number;
}

export interface StreakLine {
  readonly current: number;
  readonly graceUsed: boolean;
  readonly daysThisWeek: number;
  readonly goal: WeekGoal;
}

/** Where the card points next. Every kind but a guide finding starts a round at `setting`. */
export type NextStep =
  | { readonly kind: "insight"; readonly insight: Insight }
  | { readonly kind: "more" | "fewer" | "again"; readonly setting: Setting };

export interface ResultCard {
  readonly newBest: NewBest | null;
  readonly vsRecent: VsRecent | null;
  readonly spanChange: SpanChange | null;
  readonly streak: StreakLine;
  readonly next: NextStep;
}

export interface ResultCardInput {
  readonly round: RoundRecord;
  readonly records: readonly RoundRecord[];
  readonly results: LabResults;
  readonly goal: WeekGoal;
  /** Every local day with a round, the list the week panel counts. */
  readonly days: readonly string[];
  readonly today: string;
}

const RECENT_ROUNDS = 5;
const RECENT_MIN_ROUNDS = 3;
const MORE_AT = 90;
const FEWER_BELOW = 50;
const FEWER_MIN_PIECES = 3;

/** The setting's stored best is this round, under the rule the bests panel uses, and an earlier round at it existed. */
function newBestOf(round: RoundRecord, others: readonly RoundRecord[], results: LabResults): NewBest | null {
  const key = settingKey(round.source, round.config);
  const stored = results.bests.value?.entries.find((entry) => entry.key === key);
  if (!stored || stored.at !== round.endedAt || stored.rounds < 2) return null;
  const previous = others.reduce<RoundRecord | undefined>((best, record) => (beats(record, best) ? record : best), undefined);
  const known = previous !== undefined && others.length === stored.rounds - 1;
  const matched = known && previous.accuracy === round.accuracy;
  return {
    setting: { pieceCount: round.config.pieceCount, memorizeSeconds: round.config.memorizeSeconds },
    accuracy: round.accuracy,
    previousAccuracy: known ? previous.accuracy : null,
    fasterBy: matched ? (previous.solveMs - round.solveMs) / 1000 : null,
  };
}

function vsRecentOf(round: RoundRecord, others: readonly RoundRecord[]): VsRecent | null {
  const before = byEndedAt(others.filter(({ endedAt }) => endedAt < round.endedAt)).slice(-RECENT_ROUNDS);
  if (before.length < RECENT_MIN_ROUNDS) return null;
  return { points: Math.round(round.accuracy - mean(before.map(({ accuracy }) => accuracy))), rounds: before.length };
}

function spanChangeOf(round: RoundRecord, records: readonly RoundRecord[]): SpanChange | null {
  const to = spanOfRounds(records);
  const from = spanOfRounds(records.filter(({ id }) => id !== round.id));
  return to !== null && (from === null || to > from) ? { to } : null;
}

function nextOf(round: RoundRecord, results: LabResults): NextStep {
  const insight = results.insights.value?.insights[0];
  if (insight) return { kind: "insight", insight };
  const { pieceCount, memorizeSeconds } = round.config;
  if (round.accuracy >= MORE_AT && pieceCount < PIECE_COUNT_RANGE.max) return { kind: "more", setting: { pieceCount: pieceCount + 1, memorizeSeconds } };
  if (round.accuracy < FEWER_BELOW && pieceCount > FEWER_MIN_PIECES) return { kind: "fewer", setting: { pieceCount: pieceCount - 1, memorizeSeconds } };
  return { kind: "again", setting: { pieceCount, memorizeSeconds } };
}

/**
 * Whether the summary has counted this round yet. Reads can catch the log ahead of it, and a card built then would
 * miss a new best and print the streak a day short.
 */
export function summaryCounts(summary: LabSummary, round: RoundRecord): boolean {
  const best = summary.bests[settingKey(round.source, round.config)];
  return summary.days.includes(round.localDay) && best !== undefined && !beats(round, best);
}

/**
 * What the result screen says about the round just played, read from the same metrics as §06. A line is null when its
 * value is not there, and the whole card is null until the record holds a streak, which it does once the round is in.
 */
export function resultCardFor({ round, records, results, goal, days, today }: ResultCardInput): ResultCard | null {
  const streak = results.streak.value;
  if (!streak) return null;
  const key = settingKey(round.source, round.config);
  const others = records.filter((record) => record.id !== round.id && settingKey(record.source, record.config) === key);
  return {
    newBest: newBestOf(round, others, results),
    vsRecent: vsRecentOf(round, others),
    spanChange: spanChangeOf(round, records),
    streak: {
      current: streak.current,
      graceUsed: streak.graceUsed,
      daysThisWeek: weekProgress(days, today, goal).daysPlayed,
      goal,
    },
    next: nextOf(round, results),
  };
}
