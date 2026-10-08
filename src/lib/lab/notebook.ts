import { measured, readinessFor, shiftDay, type LabInput, type MetricResult } from "./engine";
import type { SpanStep, SpanValue } from "./progress";
import { daysBetween } from "./readiness";
import { settingKey, type RoundRecord } from "./record";
import { byEndedAt } from "./sessions";
import { beats, MAX_DAYS, type LabSummary, type PersonalBest } from "./summary";

/** Entries of one moment print in this order: the sort by time is stable over this listing. */
export const NOTEBOOK_KINDS = ["firstRound", "rounds", "first90", "best", "span", "streak"] as const;
export type NotebookKind = (typeof NOTEBOOK_KINDS)[number];

export interface NotebookEntry {
  /** The endedAt of the round the entry is about, so a stored "seen up to" time can tell new entries from old. */
  readonly at: number;
  readonly kind: NotebookKind;
  /** Interpolated into the kind's sentence under home.lab.record.notebook.entries, `day` counted from the first day played. */
  readonly params: Readonly<Record<string, number | string>>;
}

export interface NotebookValue {
  readonly entries: readonly NotebookEntry[];
  /** Null when the log holds every round. `before` is the oldest round kept, or null when the gap cannot be placed. */
  readonly older: { readonly before: number | null } | null;
}

const NOTEBOOK_LIMIT = 20;
export const NOTEBOOK_THRESHOLDS = { rounds: 1 };
const ROUND_MILESTONES: readonly number[] = [10, 50, 100, 500, 1000];
const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 100];
export const FIRST_READING_ACCURACY = 90;
const BEST_ACCURACY_GAIN = 1;
const BEST_TIME_GAIN_MS = 500;

interface History {
  /** Oldest first. */
  readonly rounds: readonly RoundRecord[];
  readonly summary: LabSummary;
  /** Rounds the summary counts that the log does not hold. */
  readonly missing: number;
  /** Rounds played before the log's oldest, known only when eviction, which drops the oldest, explains every missing one. */
  readonly before: number | null;
  /** The summary keeps the last 400 days played, so past that its first day is not the player's. */
  readonly allDays: boolean;
  readonly spanHistory: readonly SpanStep[];
}

interface Draft {
  readonly record: RoundRecord;
  readonly params: NotebookEntry["params"];
}

/** A first or a best can only be known from every round, a round count from a known number before the log, a streak from every day. */
type Needs = "wholeLog" | "roundCount" | "allDays";

const HAS: { readonly [K in Needs]: (history: History) => boolean } = {
  wholeLog: ({ missing }) => missing === 0,
  roundCount: ({ before }) => before !== null,
  allDays: ({ allDays }) => allDays,
};

interface EntrySource {
  readonly needs: Needs;
  drafts(history: History): Draft[];
}

function firstsBy<K>(rounds: readonly RoundRecord[], keyOf: (record: RoundRecord) => K | null): RoundRecord[] {
  const seen = new Set<K>();
  return rounds.filter((record) => {
    const key = keyOf(record);
    if (key === null || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const solveSeconds = (solveMs: number) => Math.round(solveMs / 100) / 10;

/**
 * A best that matches the bests panel and gained on the last best written: a point more accuracy, or the same accuracy
 * at least half a second faster with a different printed time. Smaller gains add up until one of them passes.
 */
function bestImprovements(rounds: readonly RoundRecord[]): Draft[] {
  const running = new Map<string, PersonalBest>();
  const written = new Map<string, RoundRecord>();
  return rounds.flatMap((record) => {
    const key = settingKey(record.source, record.config);
    if (!beats(record, running.get(key))) return [];
    running.set(key, { accuracy: record.accuracy, correct: record.correct, solveMs: record.solveMs, at: record.endedAt, rounds: 0 });
    const last = written.get(key);
    if (!last) {
      written.set(key, record);
      return [];
    }
    const { source, config: { pieceCount, memorizeSeconds }, accuracy, solveMs } = record;
    const by =
      accuracy >= last.accuracy + BEST_ACCURACY_GAIN
        ? "accuracy"
        : accuracy === last.accuracy && last.solveMs - solveMs >= BEST_TIME_GAIN_MS && solveSeconds(solveMs) !== solveSeconds(last.solveMs)
          ? "time"
          : null;
    if (!by) return [];
    written.set(key, record);
    return [{ record, params: { source, pieceCount, memorizeSeconds, accuracy, previous: last.accuracy, by, solveSeconds: solveSeconds(solveMs) } }];
  });
}

function spanSteps({ rounds, spanHistory }: History): Draft[] {
  const byEnd = new Map(rounds.map((record) => [record.endedAt, record]));
  let held: number | null = null;
  return spanHistory.flatMap(({ endedAt, pieceCount }) => {
    const record = byEnd.get(endedAt);
    if (pieceCount === null || pieceCount === held || !record) return [];
    const from = held ?? 0;
    held = pieceCount;
    return [{ record, params: { from, to: pieceCount } }];
  });
}

function streakMilestones({ rounds, summary }: History): Draft[] {
  const firstOnDay = new Map(firstsBy(rounds, ({ localDay }) => localDay).map((record) => [record.localDay, record]));
  let run = 0;
  return summary.days.flatMap((day, index) => {
    run = index > 0 && shiftDay(summary.days[index - 1], 1) === day ? run + 1 : 1;
    const record = firstOnDay.get(day);
    return STREAK_MILESTONES.includes(run) && record ? [{ record, params: { days: run } }] : [];
  });
}

const SOURCES: { readonly [K in NotebookKind]: EntrySource } = {
  firstRound: {
    needs: "wholeLog",
    drafts: ({ rounds: [first] }) => (first ? [{ record: first, params: { pieceCount: first.config.pieceCount, accuracy: first.accuracy } }] : []),
  },
  rounds: {
    needs: "roundCount",
    drafts: ({ rounds, before }) =>
      rounds.flatMap((record, index) => {
        const count = (before ?? 0) + index + 1;
        return ROUND_MILESTONES.includes(count) ? [{ record, params: { count } }] : [];
      }),
  },
  first90: {
    needs: "wholeLog",
    drafts: ({ rounds }) =>
      firstsBy(rounds, ({ accuracy, config }) => (accuracy >= FIRST_READING_ACCURACY ? config.pieceCount : null))
        .filter((record) => record !== rounds[0])
        .map((record) => ({ record, params: { pieceCount: record.config.pieceCount } })),
  },
  best: { needs: "wholeLog", drafts: ({ rounds }) => bestImprovements(rounds) },
  span: { needs: "wholeLog", drafts: spanSteps },
  streak: { needs: "allDays", drafts: streakMilestones },
};

function historyOf(records: readonly RoundRecord[], summary: LabSummary, span: MetricResult<SpanValue>): History {
  const rounds = byEndedAt(records);
  const missing = Math.max(0, summary.rounds - rounds.length);
  const { evictedThrough } = summary;
  const evicted = evictedThrough !== null && (rounds[0]?.endedAt ?? Infinity) > evictedThrough;
  return {
    rounds,
    summary,
    missing,
    before: missing === 0 ? 0 : evicted ? missing : null,
    allDays: summary.days.length < MAX_DAYS,
    spanHistory: span.value?.history ?? [],
  };
}

function entriesOf(history: History): NotebookEntry[] {
  const { rounds, summary, allDays } = history;
  const firstDay = summary.days[0] ?? rounds[0]?.localDay;
  return NOTEBOOK_KINDS.flatMap((kind) => {
    const source = SOURCES[kind];
    if (!HAS[source.needs](history)) return [];
    return source.drafts(history).map(({ record, params }): NotebookEntry => ({
      at: record.endedAt,
      kind,
      params: allDays ? { day: daysBetween(firstDay, record.localDay) + 1, ...params } : params,
    }));
  })
    .sort((a, b) => b.at - a.at)
    .slice(0, NOTEBOOK_LIMIT);
}

/** `span` is the span metric over the same input, so its history is not recomputed. */
export function computeNotebook(input: LabInput, span: MetricResult<SpanValue>): MetricResult<NotebookValue> {
  const { rounds } = input.summary;
  const readiness = readinessFor(input, { sampleSize: rounds, have: { rounds }, thresholds: NOTEBOOK_THRESHOLDS });
  return measured(readiness, () => {
    const history = historyOf(input.records, input.summary, span);
    const oldest = history.rounds[0];
    return {
      entries: entriesOf(history),
      older: history.missing === 0 ? null : { before: history.before !== null && oldest ? oldest.endedAt : null },
    };
  });
}
