import { NextResponse } from "next/server";
import { z } from "zod";
import en from "../../../../messages/en.json";
import type { ContactFailure } from "@/lib/contact";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

// The same rules the form checks before it sends.
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  type: z.string().min(1),
  message: z.string().min(10),
});

const STATUS: Record<ContactFailure, number> = { invalid: 400, unavailable: 503, notDelivered: 502 };

// The form shows the reason in the reader's language; details carries the English words for any other caller.
function failure(reason: ContactFailure, cause?: string) {
  if (cause) console.error(`Contact form not sent (${reason}):`, cause);
  return NextResponse.json(
    { error: "Failed to send message", reason, details: en.contact.errors.reasons[reason] },
    { status: STATUS[reason] },
  );
}

/** The sheet reads cells as typed so the timestamp stays a date; a visitor's text that would start a formula is kept as text. */
function asPlainText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export async function POST(request: Request) {
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
