import { NextResponse } from 'next/server';
import { getLeaderboardCutoffs } from '@/lib/services/leaderboardService';

/** Rendered per request so the CDN keeps the answer, which costs no ISR writes the way a revalidated segment does. */
export const dynamic = 'force-dynamic';

const CUTOFFS_PATH = '/api/leaderboard/cutoffs';
const NOT_CACHED = 'no-store';
const CUTOFFS_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600';

/**
 * Always 200, even when the cutoffs cannot be read. This endpoint feeds a
 * banner on the result screen; an error status would surface there as a broken
 * request, where `{ data: null }` reads as "we do not know" and the screen
 * simply says nothing about cutoffs.
 *
 * Nothing about the answer varies per caller, so a query string only makes a
 * new CDN key that runs the database reads again; it is redirected to the bare
 * path before any work. A null answer means the read failed, so it is never
 * given the shared cache header and an outage is not held at the edge.
 */
export async function GET(request: Request) {
  if (request.url.includes('?')) {
    return new Response(null, { status: 308, headers: { Location: CUTOFFS_PATH } });
  }

  try {
    const cutoffs = await getLeaderboardCutoffs();
    const headers = cutoffs === null ? { 'Cache-Control': NOT_CACHED } : { 'Cache-Control': CUTOFFS_CACHE };
    return NextResponse.json({ data: cutoffs }, { headers });
  } catch (err) {
    console.error('Unexpected error in GET /api/leaderboard/cutoffs:', err);
    return NextResponse.json({ data: null }, { headers: { 'Cache-Control': NOT_CACHED } });
  }
}
