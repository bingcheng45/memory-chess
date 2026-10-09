import { NextRequest, NextResponse } from 'next/server';
import { MAX_SEALED_CHARS, parseBackupRequest } from '@/lib/lab/backupRequest';
import { runBackup } from '@/lib/services/labBackupService';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';
import { isJson, readBodyWithinLimit } from '@/lib/server/requestBody';

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
  // Switched off, every method gets an empty 404 before any other check, so no answer depends on the request.
  if (!isEnabled() || request.method !== 'POST') return new NextResponse(null, { status: 404 });

  // Without a preflight another site can only POST text/plain or a form type, so this keeps it from using visitors' browsers.
  if (!isJson(request.headers.get('content-type'))) return reply({ error: 'Content-Type must be application/json' }, 415);

  const verdict = allowRequest(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return reply({ error: 'Too many backup requests. Please wait a minute.' }, 429, { 'Retry-After': String(verdict.retryAfterSeconds) });
  }

  const text = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (text === null) return reply({ error: 'This record is too large to back up. Download it instead.' }, 413);

  const backup = parseBackupRequest(parseJson(text));
  if (!backup) return reply({ error: 'Invalid backup request' }, 400);

  const result = await runBackup(backup);
  switch (result.status) {
    case 'unavailable':
      console.error('Lab backup unavailable:', result.cause);
      return reply({ error: 'Backup is unavailable. Please try again later.' }, 503);
    case 'conflict':
      return reply({ error: 'This backup changed on another device. Restore it, then back up again.', savedAt: result.savedAt }, 409);
    case 'ok':
      return reply({ data: result.data });
  }
}

export { handle as GET, handle as HEAD, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
