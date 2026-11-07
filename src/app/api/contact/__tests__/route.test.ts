/** @jest-environment node */

import { POST } from "@/app/api/contact/route";
import { appendGoogleSheetRow, SheetsConfigError } from "@/lib/server/googleSheets";

jest.mock("@/lib/server/googleSheets", () => ({
  ...jest.requireActual("@/lib/server/googleSheets"),
  appendGoogleSheetRow: jest.fn(),
}));

const mockAppend = jest.mocked(appendGoogleSheetRow);

const validBody = { name: "Verify Run", email: "verify@example.com", type: "feedback", message: "verification probe, please ignore" };

let nextAddress = 0;
const freshAddress = () => `192.0.2.${(nextAddress += 1)}`;

const post = (body: string, address = freshAddress()) =>
  POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": address }, body }));

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

  it("writes a business inquiry with a 100-character name and a 5000-character message", async () => {
    const [name, message] = ["n".repeat(100), "m".repeat(5000)];
    const response = await post(JSON.stringify({ ...validBody, type: "business", name, message }));

    expect(response.status).toBe(200);
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ row: [expect.any(String), name, "verify@example.com", "business", message] }));
  });

  it("takes five messages in ten minutes from one address and refuses the sixth with a Retry-After", async () => {
    const address = freshAddress();
    const statuses = [];
    for (let sent = 0; sent < 5; sent += 1) statuses.push((await post(JSON.stringify(validBody), address)).status);
    const refused = await post(JSON.stringify(validBody), address);
    const other = await post(JSON.stringify(validBody));

    expect(statuses).toEqual([200, 200, 200, 200, 200]);
    expect([refused.status, refused.headers.get("Retry-After"), await refused.json(), other.status]).toEqual([
      429,
      "600",
      { error: "Failed to send message", reason: "unavailable", details: "Messages can't be sent right now. Please try again later." },
      200,
    ]);
    expect(mockAppend).toHaveBeenCalledTimes(6);
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

  it("refuses a body that is not labelled JSON with a 415 and no row", async () => {
    const response = await POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "text/plain", "x-forwarded-for": freshAddress() }, body: JSON.stringify(validBody) }));

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Failed to send message", reason: "invalid", details: "Some details were not accepted. Check the form and try again." });
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it("takes the largest body the form allows, 100-character name, 254-character email, 5000-character message, all three bytes a character", async () => {
    const body = JSON.stringify({ name: "名".repeat(100), email: `${"e".repeat(242)}@example.com`.slice(0, 254), type: "business", message: "言".repeat(5000) });

    expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(15_000);
    expect((await post(body)).status).toBe(200);
  });

  it("refuses a body of 20481 bytes with a 413 and no row", async () => {
    const response = await post(JSON.stringify({ ...validBody, padding: "x".repeat(20_481) }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Failed to send message", reason: "invalid", details: "Some details were not accepted. Check the form and try again." });
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it.each([
    ["a body that is not JSON", "{"],
    ["a short name", JSON.stringify({ ...validBody, name: "V" })],
    ["a bad email", JSON.stringify({ ...validBody, email: "not-an-email" })],
    ["no inquiry type", JSON.stringify({ ...validBody, type: "" })],
    ["a short message", JSON.stringify({ ...validBody, message: "too short" })],
    ["an inquiry type the form does not offer", JSON.stringify({ ...validBody, type: "=HYPERLINK(\"https://example.com\")" })],
    ["a name over 100 characters", JSON.stringify({ ...validBody, name: "n".repeat(101) })],
    ["an email over 254 characters", JSON.stringify({ ...validBody, email: `${"e".repeat(243)}@example.com` })],
    ["a message over 5000 characters", JSON.stringify({ ...validBody, message: "m".repeat(5001) })],
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
