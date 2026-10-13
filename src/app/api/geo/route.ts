import { NextRequest, NextResponse } from 'next/server';
import { parseCountryCode, WORLD_CODE } from '@/lib/leaderboard/countries';

/** The country Vercel's edge reads from the connection, never the address itself, to suggest a country to the daily join form. */
export function GET(request: NextRequest) {
  const code = parseCountryCode(request.headers.get('x-vercel-ip-country'));
  return NextResponse.json(
    { country: code === WORLD_CODE ? null : code },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
