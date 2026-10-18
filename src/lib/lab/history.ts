import type { GameHistory } from "@/lib/types/game";
import { configKey, type RoundRecord } from "./record";

/** Where a round came from, as the history names it: practice is the homepage calibration, the rest are /game rounds. */
export const HISTORY_SOURCES = ["game", "daily", "plan", "review", "practice"] as const;
export type HistorySource = (typeof HISTORY_SOURCES)[number];

export function sourceOf(record: RoundRecord): HistorySource {
  if (record.source === "calibration") return "practice";
  if (record.v === 1) return "game";
  if (record.kind === "review") return "review";
  if (record.kind === "daily") return "daily";
  return record.startSource === "plan" ? "plan" : "game";
}

/**
 * One round of the lab record, which holds every round played on this device. The game store keeps only the newest
 * rated /game rounds, so it adds nothing but the rating change, joined on the round id the two share; a round it no
 * longer holds, or never rated, has none.
 */
export interface HistoryRound {
  readonly record: RoundRecord;
  readonly source: HistorySource;
  readonly setting: string;
  readonly ratingChange: number | null;
}

export type RatedRound = Pick<GameHistory, "id" | "timestamp" | "skillRatingChange">;

/** Newest first. */
export function historyOf(records: readonly RoundRecord[], rated: readonly RatedRound[]): HistoryRound[] {
  const changes = new Map(rated.flatMap(({ id, skillRatingChange }) => (skillRatingChange === undefined ? [] : [[id, skillRatingChange] as const])));
  return [...records]
    .sort((a, b) => b.endedAt - a.endedAt)
    .map((record) => ({ record, source: sourceOf(record), setting: configKey(record.config), ratingChange: changes.get(record.id) ?? null }));
}

export interface HistorySetting {
  readonly key: string;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

/** The sources and settings the record holds, the only choices a filter offers. Settings run from fewest pieces. */
export function historyFacets(rounds: readonly HistoryRound[]): { readonly sources: readonly HistorySource[]; readonly settings: readonly HistorySetting[] } {
  const settings = new Map<string, HistorySetting>();
  rounds.forEach(({ setting, record: { config } }) => settings.set(setting, { key: setting, pieceCount: config.pieceCount, memorizeSeconds: config.memorizeSeconds }));
  return {
    sources: HISTORY_SOURCES.filter((source) => rounds.some((round) => round.source === source)),
    settings: [...settings.values()].sort((a, b) => a.pieceCount - b.pieceCount || a.memorizeSeconds - b.memorizeSeconds),
  };
}

export const ALL = "all";

export interface HistoryFilter {
  readonly source: HistorySource | typeof ALL;
  readonly setting: string;
}

export const NO_FILTER: HistoryFilter = { source: ALL, setting: ALL };

export const filterHistory = (rounds: readonly HistoryRound[], { source, setting }: HistoryFilter): HistoryRound[] =>
  rounds.filter((round) => (source === ALL || round.source === source) && (setting === ALL || round.setting === setting));
