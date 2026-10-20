import { getGameMetric } from "@/lib/services/gameStatsService";

/** Finished games across all players, and when the count was last written. */
export interface PlayCount {
  readonly plays: number;
  readonly asOf: string;
}

/** The finished-game count for server-rendered pages, or null when it cannot be read. */
export async function getTotalPlays(): Promise<PlayCount | null> {
  const { data, error } = await getGameMetric("total_plays");
  if (error || !data) return null;
  // Postgres bigint arrives as a numeric string.
  const plays = Number(data.metric_value);
  return Number.isFinite(plays) ? { plays, asOf: data.last_updated } : null;
}
