import { NextResponse } from 'next/server';
import { getLeaderboardCutoffs } from '@/lib/services/leaderboardService';

export const revalidate = 300;

/**
 * Always 200, even when the cutoffs cannot be read. This endpoint feeds a
 * banner on the result screen; an error status would surface there as a broken
 * request, where `{ data: null }` reads as "we do not know" and the screen
 * simply says nothing about cutoffs.
 *
 * Takes no request: nothing about the answer varies per caller, which is what
 * lets the segment stay cached for `revalidate` seconds.
 */
export async function GET() {
  try {
    const cutoffs = await getLeaderboardCutoffs();
    return NextResponse.json({ data: cutoffs });
  } catch (err) {
    console.error('Unexpected error in GET /api/leaderboard/cutoffs:', err);
    return NextResponse.json({ data: null });
  }
}
