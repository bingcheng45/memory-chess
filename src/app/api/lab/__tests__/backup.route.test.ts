/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/lab/backup/route";
import { runBackup } from "@/lib/services/labBackupService";

jest.mock("@/lib/services/labBackupService", () => ({ runBackup: jest.fn() }));

const LOOKUP = "GzS0Asu0aZQJ4xDR4UiO1fLsudFOtZo_eVr0gec2pVc";
const SEALED = Buffer.alloc(29, 7).toString("base64");
const SAVED_AT = "2026-10-09T12:00:00.000Z";
let nextAddress = 0;

function caller() {
  nextAddress += 1;
  const headers = { "x-forwarded-for": `198.51.100.${nextAddress}`, "content-type": "application/json" };
  return (body: unknown) =>
    POST(new NextRequest("http://localhost/api/lab/backup", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) }));
}

async function reply(response: Response) {
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, cache: response.headers.get("Cache-Control") };
}

describe("/api/lab/backup with the flag off", () => {
  beforeEach(() => {
    delete process.env.LAB_BACKUP;
    jest.mocked(runBackup).mockReset();
  });

  it("answers 404 with no body to a well-formed backup, and never reaches the store", async () => {
    const response = await caller()({ action: "put", lookup: LOOKUP, sealed: SEALED });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(runBackup).not.toHaveBeenCalled();
  });

  it("answers 404 to any other method too, so the route does not show it exists", async () => {
    const response = await GET(new NextRequest("http://localhost/api/lab/backup"));

    expect(response.status).toBe(404);
  });
});

describe("/api/lab/backup with the flag on", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    process.env.LAB_BACKUP = "on";
    jest.mocked(runBackup).mockReset();
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.LAB_BACKUP;
    logged.mockRestore();
  });

  it("stores a sealed record under its lookup, uncached", async () => {
    jest.mocked(runBackup).mockResolvedValue({ status: "ok", data: { savedAt: SAVED_AT } });

    await expect(reply(await caller()({ action: "put", lookup: LOOKUP, sealed: SEALED }))).resolves.toEqual({
      status: 200,
      body: { data: { savedAt: SAVED_AT } },
      cache: "no-store",
    });
    expect(jest.mocked(runBackup).mock.calls).toEqual([[{ action: "put", lookup: LOOKUP, sealed: SEALED }]]);
  });

  it("reads and deletes by lookup alone", async () => {
    jest.mocked(runBackup).mockResolvedValueOnce({ status: "ok", data: null }).mockResolvedValueOnce({ status: "ok", data: { deleted: true } });
    const ask = caller();

    await expect(reply(await ask({ action: "get", lookup: LOOKUP }))).resolves.toEqual({ status: 200, body: { data: null }, cache: "no-store" });
    await expect(reply(await ask({ action: "delete", lookup: LOOKUP }))).resolves.toEqual({ status: 200, body: { data: { deleted: true } }, cache: "no-store" });
    expect(jest.mocked(runBackup).mock.calls).toEqual([[{ action: "get", lookup: LOOKUP }], [{ action: "delete", lookup: LOOKUP }]]);
  });

  it.each([
    ["text that is not JSON", "{"],
    ["an unknown action", { action: "list", lookup: LOOKUP }],
    ["a short lookup", { action: "get", lookup: "abc" }],
    ["a padded lookup", { action: "get", lookup: `${LOOKUP.slice(1)}=` }],
    ["a put with no record", { action: "put", lookup: LOOKUP }],
    ["a record that is not base64", { action: "put", lookup: LOOKUP, sealed: "not base64!" }],
    ["a record under the sealed minimum", { action: "put", lookup: LOOKUP, sealed: Buffer.alloc(28).toString("base64") }],
    ["a record just over 1 MiB", { action: "put", lookup: LOOKUP, sealed: Buffer.alloc(1024 * 1024 + 1).toString("base64") }],
  ])("refuses %s without reaching the store", async (_, body) => {
    await expect(reply(await caller()(body))).resolves.toEqual({ status: 400, body: { error: "Invalid backup request" }, cache: "no-store" });
    expect(runBackup).not.toHaveBeenCalled();
  });

  it("refuses a body larger than the largest record before parsing it", async () => {
    const sealed = Buffer.alloc(1024 * 1024 + 300).toString("base64");

    await expect(reply(await caller()({ action: "put", lookup: LOOKUP, sealed }))).resolves.toEqual({
      status: 413,
      body: { error: "This record is too large to back up. Download it instead." },
      cache: "no-store",
    });
    expect(runBackup).not.toHaveBeenCalled();
  });

  it("allows 6 requests a minute from one address", async () => {
    jest.mocked(runBackup).mockResolvedValue({ status: "ok", data: null });
    const ask = caller();
    for (let index = 0; index < 6; index += 1) await ask({ action: "get", lookup: LOOKUP });

    const limited = await ask({ action: "get", lookup: LOOKUP });

    expect([limited.status, limited.headers.get("Retry-After")]).toEqual([429, "60"]);
    expect(runBackup).toHaveBeenCalledTimes(6);
  });

  it("says the backup is unavailable without passing on the cause", async () => {
    jest.mocked(runBackup).mockResolvedValue({ status: "unavailable", cause: new Error("service key missing") });

    await expect(reply(await caller()({ action: "get", lookup: LOOKUP }))).resolves.toEqual({
      status: 503,
      body: { error: "Backup is unavailable. Please try again later." },
      cache: "no-store",
    });
    expect(logged).toHaveBeenCalledWith("Lab backup unavailable:", new Error("service key missing"));
  });

  it("still answers 404 to a method other than POST", async () => {
    expect((await GET(new NextRequest("http://localhost/api/lab/backup"))).status).toBe(404);
  });
});
