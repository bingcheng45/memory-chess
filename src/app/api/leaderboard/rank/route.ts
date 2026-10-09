import { NextRequest, NextResponse } from 'next/server';
import { getStanding } from '@/lib/services/leaderboardService';
import { isEntryId, isStandingScope } from '@/lib/leaderboard/standing';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';

const CHECKS_PER_MINUTE = 10;
const allowCheck = fixedWindowLimiter({ limit: CHECKS_PER_MINUTE, windowMs: 60_000, maxKeys: 5_000 });

function reply(body: object, status = 200, headers: Record<string, string> = {}) {
  // A standing is one player's, read on their press; nothing between them and the board may keep it.
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

/** One entry's rank on its difficulty, worldwide or in its own country. Read only when a player asks for it. */
export async function GET(request: NextRequest) {
  const verdict = allowCheck(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return reply(
      { error: 'Too many standing checks. Please wait a minute.' },
      429,
      { 'Retry-After': String(verdict.retryAfterSeconds) },
    );
  }

  const id = request.nextUrl.searchParams.get('id');
  const scope = request.nextUrl.searchParams.get('scope') ?? 'world';
  if (!isEntryId(id) || !isStandingScope(scope)) {
    return reply({ error: 'Invalid standing request' }, 400);
  }

  try {
    const result = await getStanding(id, scope);
    switch (result.status) {
      case 'ranked':
        return reply({ data: result.standing });
      case 'missing':
        return reply({ error: 'This entry is no longer on the leaderboard' }, 404);
      case 'noCountry':
        return reply({ error: 'This entry has no country' }, 400);
      case 'unavailable':
        console.error('Leaderboard standing unavailable:', result.cause);
        return reply({ error: 'The leaderboard is unavailable. Please try again shortly.' }, 503);
    }
  } catch (err) {
    console.error('Unexpected error in GET /api/leaderboard/rank:', err);
    return reply({ error: 'The leaderboard is unavailable. Please try again shortly.' }, 503);
  }
}
