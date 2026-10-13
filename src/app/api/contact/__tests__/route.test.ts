/** @jest-environment node */

import { POST } from "@/app/api/contact/route";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";

jest.mock("@/lib/server/googleSheets", () => ({
  ...jest.requireActual("@/lib/server/googleSheets"),
  appendGoogleSheetRow: jest.fn(),
}));

const mockAppend = jest.mocked(appendGoogleSheetRow);

const validBody = { name: "Verify Run", email: "verify@example.com", type: "feedback", message: "verification probe, please ignore" };

const post = (body: string) =>
  POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body }));

describe("POST /api/contact", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockAppend.mockReset();
    mockAppend.mockResolvedValue();
    jest.spyOn(console, "log").mockImplementation(() => {});
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("writes the four fields after a timestamp", async () => {
    const response = await post(JSON.stringify(validBody));

    expect(response.status).toBe(200);
    expect(mockAppend).toHaveBeenCalledWith({
      range: "Sheet1!A:E",
      row: [expect.any(String), "Verify Run", "verify@example.com", "feedback", "verification probe, please ignore"],
      valueInputOption: "USER_ENTERED",
    });
  });

  it("keeps a visitor's text that would start a spreadsheet formula as plain text", async () => {
    const response = await post(JSON.stringify({ ...validBody, name: "=HYPERLINK(1)", message: "+1 this is a message" }));

    expect(response.status).toBe(200);
    expect(mockAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        row: [expect.any(String), "'=HYPERLINK(1)", "verify@example.com", "feedback", "'+1 this is a message"],
      }),
    );
  });

  it("names a missing configuration in user words and logs the technical cause", async () => {
    mockAppend.mockRejectedValueOnce(new SheetsConfigError("Google service account key is missing"));

    const response = await post(JSON.stringify(validBody));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Failed to send message",
      reason: "unavailable",
      details: "Messages can't be sent right now. Please try again later.",
    });
    expect(consoleError).toHaveBeenCalledWith("Contact form not sent (unavailable):", "Google service account key is missing");
  });

  it("names a failed sheet write in user words and logs the technical cause", async () => {
    mockAppend.mockRejectedValueOnce(new Error("Google Sheets append failed with status 403"));

    const response = await post(JSON.stringify(validBody));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Failed to send message",
      reason: "notDelivered",
      details: "Your message could not be delivered. Please try again.",
    });
    expect(consoleError).toHaveBeenCalledWith("Contact form not sent (notDelivered):", "Google Sheets append failed with status 403");
  });

  it.each([
    ["a body that is not JSON", "{"],
    ["a short name", JSON.stringify({ ...validBody, name: "V" })],
    ["a bad email", JSON.stringify({ ...validBody, email: "not-an-email" })],
    ["no inquiry type", JSON.stringify({ ...validBody, type: "" })],
    ["a short message", JSON.stringify({ ...validBody, message: "too short" })],
  ])("refuses %s without writing a row", async (_case, body) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Failed to send message",
      reason: "invalid",
      details: "Some details were not accepted. Check the form and try again.",
    });
    expect(mockAppend).not.toHaveBeenCalled();
  });
});
