import { NextResponse } from "next/server";
import {
  createFeedbackSheetRow,
  feedbackSubmissionSchema,
} from "@/lib/feedback";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import { appendGoogleSheetRow } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
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

    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
