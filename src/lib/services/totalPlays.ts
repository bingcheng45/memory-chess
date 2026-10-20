import { getGameMetric } from "@/lib/services/gameStatsService";

export interface PlayCount {
  readonly plays: number;
  readonly asOf: string;
}

function parseCount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return NaN;
}

export async function getTotalPlays(): Promise<PlayCount | null> {
  const { data, error } = await getGameMetric("total_plays");
  if (error || !data) return null;
  const plays = parseCount(data.metric_value);
  return Number.isFinite(plays) ? { plays, asOf: data.last_updated } : null;
}
