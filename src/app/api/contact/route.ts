import { NextResponse } from "next/server";
import { z } from "zod";
import en from "../../../../messages/en.json";
import { CONTACT_MAX_LENGTH, CONTACT_TYPE_VALUES, type ContactFailure } from "@/lib/contact";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";
import { isJson, readBodyWithinLimit } from "@/lib/server/requestBody";
import { reportServerError } from "@/lib/server/serverErrors";

export const runtime = "nodejs";

// The same rules the form checks before it sends.
const contactSchema = z.object({
  name: z.string().min(2).max(CONTACT_MAX_LENGTH.name),
  email: z.string().max(CONTACT_MAX_LENGTH.email).email(),
  type: z.enum(CONTACT_TYPE_VALUES),
  message: z.string().min(10).max(CONTACT_MAX_LENGTH.message),
});

const UTF8_BYTES_PER_UTF16_UNIT = 3;
const OTHER_FIELDS_ALLOWANCE_BYTES = 1024;
const BODY_BYTE_STEP = 4096;
/** A form filled to every limit in CJK is 3 bytes a character, so the cap follows the field limits and rounds up to 20480. */
const MAX_BODY_BYTES =
  Math.ceil(
    ((CONTACT_MAX_LENGTH.name + CONTACT_MAX_LENGTH.email + CONTACT_MAX_LENGTH.message) * UTF8_BYTES_PER_UTF16_UNIT + OTHER_FIELDS_ALLOWANCE_BYTES) /
      BODY_BYTE_STEP,
  ) * BODY_BYTE_STEP;

/** A person sends one or two messages; more than this from one address is a script filling the sheet. */
const MESSAGES_PER_WINDOW = 5;
const allowMessage = fixedWindowLimiter({ limit: MESSAGES_PER_WINDOW, windowMs: 10 * 60_000, maxKeys: 5_000 });

const STATUS: Record<ContactFailure, number> = { invalid: 400, unavailable: 503, notDelivered: 502 };

// The form shows the reason in the reader's language; details carries the English words for any other caller.
function failure(reason: ContactFailure, cause?: string, init: ResponseInit = { status: STATUS[reason] }) {
  if (cause) {
    console.error(`Contact form not sent (${reason}):`, cause);
    reportServerError("POST /api/contact", reason === "unavailable" ? "unavailable" : "failed", cause);
  }
  return NextResponse.json({ error: "Failed to send message", reason, details: en.contact.errors.reasons[reason] }, init);
}

/** The sheet reads cells as typed so the timestamp stays a date; a visitor's text that would start a formula is kept as text. */
function asPlainText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export async function POST(request: Request) {
  const verdict = allowMessage(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return failure("unavailable", undefined, { status: 429, headers: { "Retry-After": String(verdict.retryAfterSeconds) } });
  }

  if (!isJson(request.headers.get("content-type"))) return failure("invalid", undefined, { status: 415 });

  const text = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (text === null) return failure("invalid", undefined, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return failure("invalid");
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return failure("invalid");

  const { name, email, type, message } = parsed.data;
  const [safeName, safeEmail, safeMessage] = [name, email, message].map(asPlainText);
  try {
    await appendGoogleSheetRow({
      range: "Sheet1!A:E",
      row: [new Date().toISOString(), safeName, safeEmail, type, safeMessage],
      valueInputOption: "USER_ENTERED",
    });
  } catch (error: unknown) {
    const cause = error instanceof Error ? error.message : "Unknown error";
    return failure(error instanceof SheetsConfigError ? "unavailable" : "notDelivered", cause);
  }

  return NextResponse.json({ success: true, message: "Form submitted successfully" });
}
