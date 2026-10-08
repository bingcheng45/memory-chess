import { measured, readinessFor, shiftDay, type LabInput, type MetricResult } from "./engine";
import { computeSpan } from "./progress";
import { daysBetween } from "./readiness";
import { settingKey, type RoundRecord } from "./record";
import { byEndedAt } from "./sessions";
import { beats, type LabSummary, type PersonalBest } from "./summary";

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
}

export const NOTEBOOK_LIMIT = 20;
export const NOTEBOOK_THRESHOLDS = { rounds: 1 };
export const ROUND_MILESTONES: readonly number[] = [10, 50, 100, 500, 1000];
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 100];
export const FIRST_READING_ACCURACY = 90;

interface History {
  /** Oldest first. */
  readonly rounds: readonly RoundRecord[];
  readonly summary: LabSummary;
  /** Rounds the summary counts that the log no longer holds. */
  readonly evicted: number;
}

interface Draft {
  readonly record: RoundRecord;
  readonly params: NotebookEntry["params"];
}

interface EntrySource {
  /** A first or a best can only be known from every round, so it is left out once older rounds were evicted. */
  readonly wholeLog: boolean;
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

function bestImprovements(rounds: readonly RoundRecord[]): Draft[] {
  const running = new Map<string, PersonalBest>();
  return rounds.flatMap((record) => {
    const key = settingKey(record.source, record.config);
    const previous = running.get(key);
    if (!beats(record, previous)) return [];
    running.set(key, { accuracy: record.accuracy, correct: record.correct, solveMs: record.solveMs, at: record.endedAt, rounds: 0 });
    if (!previous) return [];
    const { source, config: { pieceCount, memorizeSeconds }, accuracy, solveMs } = record;
    const by = accuracy > previous.accuracy ? "accuracy" : "time";
    return [{ record, params: { source, pieceCount, memorizeSeconds, accuracy, previous: previous.accuracy, by, solveSeconds: Math.round(solveMs / 100) / 10 } }];
  });
}

function spanSteps({ rounds, summary }: History): Draft[] {
  const byEnd = new Map(rounds.map((record) => [record.endedAt, record]));
  let held: number | null = null;
  return (computeSpan({ records: rounds, summary, today: "" }).value?.history ?? []).flatMap(({ endedAt, pieceCount }) => {
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
    wholeLog: true,
    drafts: ({ rounds: [first] }) => (first ? [{ record: first, params: { pieceCount: first.config.pieceCount, accuracy: first.accuracy } }] : []),
  },
  rounds: {
    wholeLog: false,
    drafts: ({ rounds, evicted }) =>
      rounds.flatMap((record, index) => (ROUND_MILESTONES.includes(evicted + index + 1) ? [{ record, params: { count: evicted + index + 1 } }] : [])),
  },
  first90: {
    wholeLog: true,
    drafts: ({ rounds }) =>
      firstsBy(rounds, ({ accuracy, config }) => (accuracy >= FIRST_READING_ACCURACY ? config.pieceCount : null)).map((record) => ({
        record,
        params: { pieceCount: record.config.pieceCount },
      })),
  },
  best: { wholeLog: true, drafts: ({ rounds }) => bestImprovements(rounds) },
  span: { wholeLog: true, drafts: spanSteps },
  streak: { wholeLog: false, drafts: streakMilestones },
};

export function notebookEntries(records: readonly RoundRecord[], summary: LabSummary): NotebookEntry[] {
  const rounds = byEndedAt(records);
  const history: History = { rounds, summary, evicted: Math.max(0, summary.rounds - rounds.length) };
  const firstDay = summary.days[0] ?? rounds[0]?.localDay;
  return NOTEBOOK_KINDS.flatMap((kind) => {
    const source = SOURCES[kind];
    if (source.wholeLog && history.evicted > 0) return [];
    return source.drafts(history).map(({ record, params }): NotebookEntry => ({
      at: record.endedAt,
      kind,
      params: { day: daysBetween(firstDay, record.localDay) + 1, ...params },
    }));
  })
    .sort((a, b) => b.at - a.at)
    .slice(0, NOTEBOOK_LIMIT);
}

export function computeNotebook(input: LabInput): MetricResult<NotebookValue> {
  const { rounds } = input.summary;
  const readiness = readinessFor(input, { sampleSize: rounds, have: { rounds }, thresholds: NOTEBOOK_THRESHOLDS });
  return measured(readiness, () => ({ entries: notebookEntries(input.records, input.summary) }));
}
