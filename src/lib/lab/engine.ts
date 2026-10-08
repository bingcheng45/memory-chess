import { hasFigure, LAB_THRESHOLDS, readinessOf, type Need, type Readiness } from "./readiness";
import { localDayOf, settingKey, type LabSource, type RoundConfig, type RoundRecord } from "./record";
import type { StoredPlan, StoredTarget } from "./choices";
import type { LabSummary } from "./summary";
import { byEndedAt } from "./sessions";

export interface LabInput {
  /** The capped round log, oldest first or in any order. */
  readonly records: readonly RoundRecord[];
  readonly summary: LabSummary;
  /** The client's local day, passed in so every metric is a pure function of its input. */
  readonly today: string;
  /** The player's chosen plan and goal on this device, null or left out when none is chosen. */
  readonly plan?: StoredPlan | null;
  readonly target?: StoredTarget | null;
}

/** A metric's value is null when its readiness is empty, and for speed while no round can be read. */
export interface MetricResult<TValue> {
  readonly readiness: Readiness;
  readonly value: TValue | null;
}

export function measured<TValue>(readiness: Readiness, value: () => TValue): MetricResult<TValue> {
  return { readiness, value: readiness.state === "empty" ? null : value() };
}

/** Staleness reads the player's last day of play, the same for every metric. */
export function readinessFor(
  { summary, today }: LabInput,
  measure: { sampleSize: number; played?: number; have: Need; thresholds: Need },
): Readiness {
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
 * One setting only, since mixing settings would read harder rounds as decline. Settings are ranked on the last
 * `window` rounds, so an abandoned setting does not win on its old count: a setting that can draw wins over one that
 * cannot, then most rounds in the window, then most recent. The chosen group holds every round at its setting.
 */
export function busiestSetting(input: LabInput, records: readonly RoundRecord[], thresholds: Need, window = Infinity): SettingGroup {
  const keyOf = (record: RoundRecord) => settingKey(record.source, record.config);
  const inWindow = new Map<string, number>();
  (Number.isFinite(window) ? byEndedAt(records).slice(-window) : records).forEach((record) => {
    const key = keyOf(record);
    inWindow.set(key, (inWindow.get(key) ?? 0) + 1);
  });
  const bySetting = new Map<string, RoundRecord[]>();
  records.forEach((record) => {
    const key = keyOf(record);
    if (!inWindow.has(key)) return;
    const group = bySetting.get(key);
    if (group) group.push(record);
    else bySetting.set(key, [record]);
  });
  const { rounds, readiness } =
    [...bySetting]
      .map(([key, group]) => ({ ...groupOf(input, group, thresholds), recent: inWindow.get(key) ?? 0 }))
      .sort((a, b) => Number(b.ready) - Number(a.ready) || b.recent - a.recent || b.latest - a.latest)[0] ??
    groupOf(input, [], thresholds);
  return { rounds: byEndedAt(rounds), readiness };
}
