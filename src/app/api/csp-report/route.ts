import { NextResponse } from "next/server";
import { parseCspReports } from "@/lib/server/cspReport";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";
import { recentKeys } from "@/lib/server/recentKeys";
import { readBodyWithinLimit } from "@/lib/server/requestBody";
import { reportServerError } from "@/lib/server/serverErrors";
import { serviceRoleWriter } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;
const REPORT_MEDIA_TYPES = new Set(["application/csp-report", "application/reports+json"]);

/** One page load can raise several violations, so this allows a burst per address and stops a script filling the table. */
const REQUESTS_PER_WINDOW = 30;
const allowRequest = fixedWindowLimiter({ limit: REQUESTS_PER_WINDOW, windowMs: 60_000, maxKeys: 5_000 });

/** The same violation repeats on every page view, so one row per distinct violation per hour per instance, with at most 5 rows a minute and 1,000 remembered keys. */
const DEDUPE_WINDOW_MS = 60 * 60_000;
const MAX_DISTINCT_VIOLATIONS = 1_000;
const ROWS_PER_MINUTE = 5;
const seen = recentKeys({ windowMs: DEDUPE_WINDOW_MS, maxKeys: MAX_DISTINCT_VIOLATIONS });
const allowRow = fixedWindowLimiter({ limit: ROWS_PER_MINUTE, windowMs: 60_000, maxKeys: 1 });

let loggedInert = false;

export async function POST(request: Request) {
  const verdict = allowRequest(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } });
  }

  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (!REPORT_MEDIA_TYPES.has(mediaType)) return new NextResponse(null, { status: 415 });

  const body = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (body === null) return new NextResponse(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!serviceRoleWriter) {
    if (!loggedInert) {
      loggedInert = true;
      console.warn("CSP reports are not stored: no service_role Supabase client (key missing, or SUPABASE_READ_ONLY is set).");
    }
    return new NextResponse(null, { status: 204 });
  }

  for (const violation of parseCspReports(payload)) {
    const { directive, blocked, path, disposition, sample } = violation;
    const key = [directive, blocked, path, disposition].join("|");
    const now = Date.now();
    if (!seen.isNew(key, now) || !allowRow("csp", now).allowed || !seen.remember(key, now)) continue;
    reportServerError("POST /api/csp-report", "violation", `${directive} blocked ${blocked || "unknown"}`, {
      directive,
      blocked,
      path,
      disposition,
      ...(sample ? { sample } : {}),
    });
  }
  return new NextResponse(null, { status: 204 });
}
