import { NextResponse } from "next/server";
import { ARTICLE_SLUGS } from "@/lib/articles/registry";
import { readArticleStats } from "@/lib/services/articleStatsService";

/** Rendered per request so the CDN keeps the answer, which costs no ISR writes the way a revalidated page does. */
export const dynamic = "force-dynamic";

const STATS_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

export async function GET() {
  const stats = await readArticleStats(ARTICLE_SLUGS);
  if (stats === null) return NextResponse.json({ error: "Article stats are unavailable" }, { status: 503 });

  const rows = Object.entries(stats).map(([slug, counts]) => ({ slug, ...counts }));
  return NextResponse.json(rows, { headers: { "Cache-Control": STATS_CACHE } });
}
