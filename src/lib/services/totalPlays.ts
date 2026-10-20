import { getGameMetric } from "@/lib/services/gameStatsService";

export interface PlayCount {
  readonly plays: number;
  readonly asOf: string;
}

export async function getTotalPlays(): Promise<PlayCount | null> {
  const { data, error } = await getGameMetric("total_plays");
  if (error || !data) return null;
  const plays = Number(data.metric_value);
  return Number.isFinite(plays) ? { plays, asOf: data.last_updated } : null;
}
