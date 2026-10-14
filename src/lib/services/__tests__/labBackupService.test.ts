/** @jest-environment node */

import { createClient } from "@supabase/supabase-js";
import { runBackup } from "@/lib/services/labBackupService";

jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));

const LOOKUP = "GzS0Asu0aZQJ4xDR4UiO1fLsudFOtZo_eVr0gec2pVc";
const rpc = jest.fn();

function answers(...results: { data: unknown; error: unknown }[]) {
  results.forEach((result) => rpc.mockReturnValueOnce({ abortSignal: () => Promise.resolve(result) }));
}

beforeAll(() => {
  jest.mocked(createClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createClient>);
});

afterEach(() => {
  rpc.mockReset();
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("runBackup", () => {
  it("is unavailable, and builds no client, without the service key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const result = await runBackup({ action: "get", lookup: LOOKUP });

    expect(result.status).toBe("unavailable");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("calls the service-only functions with the lookup and maps their rows", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    answers(
      { data: [{ saved_at: "2026-10-09T12:00:00+00:00", conflict: false }], error: null },
      { data: [{ saved_at: "2026-10-09T12:30:00.123456+00:00", conflict: true }], error: null },
      { data: [{ sealed: "AAAA", updated_at: "2026-10-09T12:00:00+00:00" }], error: null },
      { data: [], error: null },
      { data: true, error: null },
    );

    expect(
      await Promise.all([
        runBackup({ action: "put", lookup: LOOKUP, sealed: "AAAA", expectedSavedAt: null }),
        runBackup({ action: "put", lookup: LOOKUP, sealed: "AAAA", expectedSavedAt: "2026-10-09T12:00:00+00:00" }),
        runBackup({ action: "get", lookup: LOOKUP }),
        runBackup({ action: "get", lookup: LOOKUP }),
        runBackup({ action: "delete", lookup: LOOKUP }),
      ]),
    ).toEqual([
      { status: "ok", data: { savedAt: "2026-10-09T12:00:00+00:00" } },
      { status: "conflict", savedAt: "2026-10-09T12:30:00.123456+00:00" },
      { status: "ok", data: { sealed: "AAAA", savedAt: "2026-10-09T12:00:00+00:00" } },
      { status: "ok", data: null },
      { status: "ok", data: { deleted: true } },
    ]);
    expect(rpc.mock.calls).toEqual([
      ["lab_backup_put", { p_lookup: LOOKUP, p_sealed: "AAAA", p_expected: null }],
      ["lab_backup_put", { p_lookup: LOOKUP, p_sealed: "AAAA", p_expected: "2026-10-09T12:00:00+00:00" }],
      ["lab_backup_get", { p_lookup: LOOKUP }],
      ["lab_backup_get", { p_lookup: LOOKUP }],
      ["lab_backup_delete", { p_lookup: LOOKUP }],
    ]);
    expect(jest.mocked(createClient).mock.calls).toEqual([["https://example.supabase.co", "service-key", { auth: { persistSession: false } }]]);
  });

  it("is unavailable when the store answers with an error", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    answers({ data: null, error: { code: "42883", message: "function lab_backup_get does not exist" } });

    expect(await runBackup({ action: "get", lookup: LOOKUP })).toEqual({
      status: "unavailable",
      cause: { code: "42883", message: "function lab_backup_get does not exist" },
    });
  });
});
