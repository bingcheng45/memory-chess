/** @jest-environment node */

import { POST } from "@/app/api/feedback/route";
import { appendGoogleSheetRow } from "@/lib/server/googleSheets";

jest.mock("@/lib/server/googleSheets", () => ({
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
        "1.2.0",
      ],
      valueInputOption: "RAW",
    });
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
});
