import { PHASE_PRODUCTION_BUILD } from "next/constants";
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

async function readTotalPlays(): Promise<PlayCount | string> {
  const { data, error } = await getGameMetric("total_plays");
  if (error) return error;
  const plays = parseCount(data?.metric_value);
  return data && Number.isFinite(plays) ? { plays, asOf: data.last_updated } : "no total_plays value";
}

/**
 * A revalidation that throws keeps serving the last good page, while one that
 * renders would cache a page without the count for the whole window. A build
 * has no last good page and `next dev` caches nothing, so both render without it.
 */
export async function getTotalPlays(): Promise<PlayCount | null> {
  const result = await readTotalPlays();
  if (typeof result !== "string") return result;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    throw new Error(`Play count refresh failed: ${result}`);
  }
  return null;
}
