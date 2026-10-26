import { NextResponse } from "next/server";
import {
  createFeedbackSheetRow,
  feedbackSubmissionSchema,
} from "@/lib/feedback";
import { FEEDBACK_MAX_LENGTH } from "@/lib/feedbackLimits";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";
import { isJson, readBodyWithinLimit } from "@/lib/server/requestBody";
import { reportServerError } from "@/lib/server/serverErrors";

export const runtime = "nodejs";

const UTF8_BYTES_PER_UTF16_UNIT = 3;
const OTHER_FIELDS_ALLOWANCE_BYTES = 1024;
const BODY_BYTE_STEP = 4096;
/** A full-length comment in CJK is 3 bytes a character, so the cap follows the comment limit and rounds up to 8192. */
const MAX_BODY_BYTES =
  Math.ceil((FEEDBACK_MAX_LENGTH * UTF8_BYTES_PER_UTF16_UNIT + OTHER_FIELDS_ALLOWANCE_BYTES) / BODY_BYTE_STEP) * BODY_BYTE_STEP;

/** A player sends one response per round at most; more than this from one address is a script filling the sheet the contact form also writes to. */
const SUBMISSIONS_PER_WINDOW = 5;
const allowSubmission = fixedWindowLimiter({ limit: SUBMISSIONS_PER_WINDOW, windowMs: 10 * 60_000, maxKeys: 5_000 });

export async function POST(request: Request) {
  const verdict = allowSubmission(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "Too many submissions" },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } },
    );
  }

  if (!isJson(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  const text = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (text === null) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }

  let body: unknown;

  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const parsedSubmission = feedbackSubmissionSchema.safeParse(body);

  if (!parsedSubmission.success) {
    return NextResponse.json(
      {
        error: "Invalid feedback submission",
        fields: parsedSubmission.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const row = createFeedbackSheetRow(
      parsedSubmission.data,
      new Date().toISOString(),
      LATEST_CHANGELOG_ENTRY.version,
    );

    await appendGoogleSheetRow({
      range: "'Game Feedback'!A:J",
      row,
      valueInputOption: "RAW",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Failed to submit game feedback:",
      error instanceof Error ? error.message : "Unknown error",
    );
    reportServerError("POST /api/feedback", error instanceof SheetsConfigError ? "unavailable" : "failed", error);

    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
