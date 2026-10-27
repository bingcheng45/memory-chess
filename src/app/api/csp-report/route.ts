import { NextResponse } from "next/server";
import { parseCspReports } from "@/lib/server/cspReport";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";
import { readBodyWithinLimit } from "@/lib/server/requestBody";
import { reportServerError } from "@/lib/server/serverErrors";
import { serviceRoleWriter } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;
const REPORT_MEDIA_TYPES = new Set(["application/csp-report", "application/reports+json"]);

/** One page load can raise several violations, so this allows a burst per address and stops a script filling the table. */
const REQUESTS_PER_WINDOW = 30;
const allowRequest = fixedWindowLimiter({ limit: REQUESTS_PER_WINDOW, windowMs: 60_000, maxKeys: 5_000 });

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
