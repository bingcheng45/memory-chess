/** @jest-environment node */

import { POST } from "@/app/api/feedback/route";
import { appendGoogleSheetRow } from "@/lib/server/googleSheets";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";

jest.mock("@/lib/server/googleSheets", () => ({
  ...jest.requireActual("@/lib/server/googleSheets"),
  appendGoogleSheetRow: jest.fn(),
}));

const mockAppendGoogleSheetRow = jest.mocked(appendGoogleSheetRow);

const validBody = {
  rating: 5,
  feedback: "=This must remain plain text",
  accuracy: 100,
  correctPieces: 6,
  pieceCount: 6,
  difficulty: "medium",
  memorizationTime: 9,
  solutionTime: 12.5,
};

function feedbackRequest(init: { body?: string; contentType?: string | null; ip?: string } = {}) {
  const headers: Record<string, string> = { "x-forwarded-for": init.ip ?? "203.0.113.1" };
  if (init.contentType !== null) headers["Content-Type"] = init.contentType ?? "application/json";
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers,
    body: init.body ?? JSON.stringify(validBody),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    mockAppendGoogleSheetRow.mockReset();
    mockAppendGoogleSheetRow.mockResolvedValue();
  });

  it("appends a validated response to the feedback worksheet as raw data", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockAppendGoogleSheetRow).toHaveBeenCalledWith({
      range: "'Game Feedback'!A:J",
      row: [
        expect.any(String),
        5,
        "=This must remain plain text",
        100,
        6,
        6,
        "medium",
        9,
        12.5,
        LATEST_CHANGELOG_ENTRY.version,
      ],
      valueInputOption: "RAW",
    });
  });

  it("records a daily board's feedback as daily", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, pieceCount: 7, correctPieces: 5, difficulty: "daily" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockAppendGoogleSheetRow.mock.calls[0][0].row[6]).toBe("daily");
  });

  it("rejects invalid feedback without writing a row", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, rating: 6 }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockAppendGoogleSheetRow).not.toHaveBeenCalled();
  });

  it("returns a generic error when the worksheet write fails", async () => {
    mockAppendGoogleSheetRow.mockRejectedValueOnce(
      new Error("Spreadsheet configuration details"),
    );

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to submit feedback",
    });
  });

  it("answers 415 to a body that is not JSON without writing a row", async () => {
    const response = await POST(feedbackRequest({ contentType: "text/plain" }));

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Content-Type must be application/json" });
    expect(mockAppendGoogleSheetRow).not.toHaveBeenCalled();
  });

  it("answers 413 to a body over 4096 bytes without writing a row", async () => {
    const response = await POST(
      feedbackRequest({ body: JSON.stringify({ ...validBody, feedback: "x".repeat(5000) }) }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Request body is too large" });
    expect(mockAppendGoogleSheetRow).not.toHaveBeenCalled();
  });

  it("answers 429 with Retry-After once one address passes 5 submissions in 10 minutes", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await POST(feedbackRequest({ ip: "198.51.100.7" }))).status);
    }
    const blocked = await POST(feedbackRequest({ ip: "198.51.100.7" }));

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(mockAppendGoogleSheetRow).toHaveBeenCalledTimes(5);
  });

  it("keeps counting each address on its own", async () => {
    for (let i = 0; i < 5; i++) await POST(feedbackRequest({ ip: "198.51.100.8" }));

    const otherAddress = await POST(feedbackRequest({ ip: "198.51.100.9" }));

    expect(otherAddress.status).toBe(200);
  });
});
