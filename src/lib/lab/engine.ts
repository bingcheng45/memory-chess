import { hasFigure, LAB_THRESHOLDS, readinessOf, type Need, type Readiness } from "./readiness";
import { localDayOf, settingKey, type LabSource, type RoundConfig, type RoundRecord } from "./record";
import type { LabSummary } from "./summary";
import { byEndedAt } from "./sessions";

export interface LabInput {
  /** The capped round log, oldest first or in any order. */
  readonly records: readonly RoundRecord[];
  readonly summary: LabSummary;
  /** The client's local day, passed in so every metric is a pure function of its input. */
  readonly today: string;
}

/** A metric's value is null exactly when its readiness is empty. */
export interface MetricResult<TValue> {
  readonly readiness: Readiness;
  readonly value: TValue | null;
}

export function measured<TValue>(readiness: Readiness, value: () => TValue): MetricResult<TValue> {
  return { readiness, value: readiness.state === "empty" ? null : value() };
}

/** Staleness reads the player's last day of play, the same for every metric. */
export function readinessFor({ summary, today }: LabInput, measure: { sampleSize: number; have: Need; thresholds: Need }): Readiness {
  return readinessOf({ ...measure, lastDay: summary.days.at(-1) ?? null, today });
}

export const hundredths = (value: number) => Math.round(value * 100) / 100;
export const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function shiftDay(day: string, by: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return localDayOf(new Date(year, month - 1, date + by));
}

export type TrendSetting = Pick<RoundConfig, "pieceCount" | "memorizeSeconds"> & { readonly source: LabSource };

export const settingOf = ({ source, config }: RoundRecord): TrendSetting => ({
  source,
  pieceCount: config.pieceCount,
  memorizeSeconds: config.memorizeSeconds,
});

export const TREND_THRESHOLDS = { rounds: LAB_THRESHOLDS.trendRounds, days: LAB_THRESHOLDS.trendDays };

export const distinctDays = (rounds: readonly RoundRecord[]) => new Set(rounds.map(({ localDay }) => localDay)).size;

export interface SettingGroup {
  /** Oldest first. */
  readonly rounds: readonly RoundRecord[];
  readonly readiness: Readiness;
}

function groupOf(input: LabInput, rounds: readonly RoundRecord[], thresholds: Need) {
  const readiness = readinessFor(input, {
    sampleSize: input.summary.rounds === 0 ? 0 : rounds.length,
    have: { rounds: rounds.length, days: distinctDays(rounds) },
    thresholds,
  });
  const latest = rounds.reduce((max, record) => Math.max(max, record.endedAt), 0);
  return { rounds, readiness, latest, ready: hasFigure(readiness) };
}

/**
 * One setting only, since mixing settings would read harder rounds as decline. A setting that can draw wins over
 * one with more rounds that cannot, then most rounds, then most recent.
 */
export function busiestSetting(input: LabInput, records: readonly RoundRecord[], thresholds: Need): SettingGroup {
  const bySetting = new Map<string, RoundRecord[]>();
  records.forEach((record) => {
    const key = settingKey(record.source, record.config);
    const group = bySetting.get(key);
    if (group) group.push(record);
    else bySetting.set(key, [record]);
  });
  const { rounds, readiness } =
    [...bySetting.values()]
      .map((group) => groupOf(input, group, thresholds))
      .sort((a, b) => Number(b.ready) - Number(a.ready) || b.rounds.length - a.rounds.length || b.latest - a.latest)[0] ??
    groupOf(input, [], thresholds);
  return { rounds: byEndedAt(rounds), readiness };
}
