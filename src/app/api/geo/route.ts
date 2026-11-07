import { NextRequest, NextResponse } from 'next/server';
import { parseCountryCode, WORLD_CODE } from '@/lib/leaderboard/countries';

/** The country the host's edge (Vercel or Cloudflare) reads from the connection, never the address itself, to suggest a country to the daily join form. */
export function GET(request: NextRequest) {
  const code = parseCountryCode(request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry'));
  return NextResponse.json(
    { country: code === WORLD_CODE ? null : code },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
