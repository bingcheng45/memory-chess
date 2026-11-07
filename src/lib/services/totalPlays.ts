import { getGameMetric } from "@/lib/services/gameStatsService";
import { supabase } from "@/lib/supabase";
import { playCountOf, type PlayCount } from "@/lib/stats/playCount";

/**
 * The count the static home and about pages are built with. It only paints
 * first: both pages read the current count in the browser, so a build that
 * cannot read it still succeeds and renders without it.
 */
export async function getTotalPlays(): Promise<PlayCount | null> {
  if (!supabase) return null;
  const { data, error } = await getGameMetric("total_plays");
  return error ? null : playCountOf(data);
}
