import { NextRequest, NextResponse } from 'next/server';
import { MAX_SEALED_CHARS, parseBackupRequest } from '@/lib/lab/backupRequest';
import { runBackup } from '@/lib/services/labBackupService';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';
import { readBodyWithinLimit } from '@/lib/server/requestBody';

const REQUESTS_PER_MINUTE = 6;
/** The largest record plus room for the action and lookup around it. */
const MAX_BODY_BYTES = MAX_SEALED_CHARS + 200;
const allowRequest = fixedWindowLimiter({ limit: REQUESTS_PER_MINUTE, windowMs: 60_000, maxKeys: 5_000 });

/** Read on every request, so the backup stays off unless the deployment sets LAB_BACKUP=on. */
const isEnabled = () => process.env.LAB_BACKUP === 'on';

function reply(body: object, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function handle(request: NextRequest) {
  // The same empty 404 as a path that does not exist, for every method, so the switched-off route reveals nothing.
  if (!isEnabled() || request.method !== 'POST') return new NextResponse(null, { status: 404 });

  const verdict = allowRequest(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return reply({ error: 'Too many backup requests. Please wait a minute.' }, 429, { 'Retry-After': String(verdict.retryAfterSeconds) });
  }

  const text = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (text === null) return reply({ error: 'This record is too large to back up. Download it instead.' }, 413);

  const backup = parseBackupRequest(parseJson(text));
  if (!backup) return reply({ error: 'Invalid backup request' }, 400);

  const result = await runBackup(backup);
  if (result.status === 'unavailable') {
    console.error('Lab backup unavailable:', result.cause);
    return reply({ error: 'Backup is unavailable. Please try again later.' }, 503);
  }
  return reply({ data: result.data });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
