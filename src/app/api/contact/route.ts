import { NextResponse } from "next/server";
import { appendGoogleSheetRow } from "@/lib/server/googleSheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, type, message } = body;
    const timestamp = new Date().toISOString();

    await appendGoogleSheetRow({
      range: "Sheet1!A:E",
      row: [timestamp, name, email, type, message],
      valueInputOption: "USER_ENTERED",
    });

    // Don't log response data as it could contain sheet metadata
    console.log("Successfully wrote to Google Sheets");

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
    });
  } catch (error: unknown) {
    console.error("Error submitting to Google Sheets");

    // Provide more detailed error information without leaking sensitive data
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      // Only log the error message, not the stack trace
      errorMessage = error.message;
      console.error("Error type:", error.name);
    }

    return NextResponse.json(
      {
        error: "Failed to send message",
        details: errorMessage,
        // Don't include debug details in the response
      },
      { status: 500 },
    );
  }
}
