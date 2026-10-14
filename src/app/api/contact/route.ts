import { NextResponse } from "next/server";
import { z } from "zod";
import en from "../../../../messages/en.json";
import { CONTACT_MAX_LENGTH, CONTACT_TYPE_VALUES, type ContactFailure } from "@/lib/contact";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

// The same rules the form checks before it sends.
const contactSchema = z.object({
  name: z.string().min(2).max(CONTACT_MAX_LENGTH.name),
  email: z.string().max(CONTACT_MAX_LENGTH.email).email(),
  type: z.enum(CONTACT_TYPE_VALUES),
  message: z.string().min(10).max(CONTACT_MAX_LENGTH.message),
});

/** A person sends one or two messages; more than this from one address is a script filling the sheet. */
const MESSAGES_PER_WINDOW = 5;
const allowMessage = fixedWindowLimiter({ limit: MESSAGES_PER_WINDOW, windowMs: 10 * 60_000, maxKeys: 5_000 });

const STATUS: Record<ContactFailure, number> = { invalid: 400, unavailable: 503, notDelivered: 502 };

// The form shows the reason in the reader's language; details carries the English words for any other caller.
function failure(reason: ContactFailure, cause?: string, init: ResponseInit = { status: STATUS[reason] }) {
  if (cause) console.error(`Contact form not sent (${reason}):`, cause);
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

  let body: unknown;
  try {
    body = await request.json();
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
