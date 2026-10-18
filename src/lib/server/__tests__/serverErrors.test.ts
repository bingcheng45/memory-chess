/** @jest-environment node */

const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.fake-signature";
const ANON_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6ImFub24ifQ.fake-signature";

type Insert = { readonly key: string; readonly table: string; readonly row: unknown; readonly signal: AbortSignal };
type Outcome = "stored" | "refused" | "networkDown" | "throws" | "hangs";

const inserts: Insert[] = [];
let outcome: Outcome = "stored";

jest.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, key: string) => ({
    from: (table: string) => ({
      insert: (row: unknown) => {
        if (outcome === "throws") throw new Error("fetch is not a function");
        return {
          abortSignal: (signal: AbortSignal) => {
            inserts.push({ key, table, row, signal });
            if (outcome === "networkDown") return Promise.reject(new TypeError("fetch failed"));
            if (outcome === "hangs") return new Promise(() => {});
            if (outcome === "refused") return Promise.resolve({ error: { code: "42501", message: "permission denied for table server_errors" } });
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  }),
}));

type Env = { readonly serviceKey?: string; readonly readOnly?: boolean; readonly deploy?: string };

function setEnv({ serviceKey = SERVICE_ROLE_JWT, readOnly = false, deploy = "e891778cabb5b45da7cdd343b015e0da53aeae73" }: Env) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_JWT;
  process.env.VERCEL_GIT_COMMIT_SHA = deploy;
  if (serviceKey === "") delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  if (readOnly) process.env.SUPABASE_READ_ONLY = "true";
  else delete process.env.SUPABASE_READ_ONLY;
}

async function freshReporter(env: Env = {}) {
  setEnv(env);
  let reporter!: typeof import("@/lib/server/serverErrors");
  await jest.isolateModulesAsync(async () => {
    reporter = await import("@/lib/server/serverErrors");
  });
  return reporter.reportServerError;
}

const settle = () => new Promise((resolve) => setImmediate(resolve));
const rows = () => inserts.map(({ row }) => row);

let error: jest.SpyInstance;

beforeEach(() => {
  inserts.length = 0;
  outcome = "stored";
  error = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_READ_ONLY;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
});

describe("reportServerError", () => {
  it("writes one row to server_errors with the service key: route, kind, message, error name, detail and deploy", async () => {
    const report = await freshReporter();

    report("POST /api/leaderboard", "failed", new TypeError("fetch failed"), { board: "medium" });
    await settle();

    expect(inserts.map(({ key, table }) => [key, table])).toEqual([[SERVICE_ROLE_JWT, "server_errors"]]);
    expect(rows()).toEqual([
      {
        route: "POST /api/leaderboard",
        kind: "failed",
        message: "fetch failed",
        detail: { name: "TypeError", board: "medium" },
        deploy: "e891778cabb5b45da7cdd343b015e0da53aeae73",
      },
    ]);
  });

  it("keeps a Supabase error's code and message and drops its details and hint, which can hold the row", async () => {
    const report = await freshReporter({ deploy: "" });

    report("POST /api/leaderboard", "failed", {
      code: "23514",
      message: 'new row for relation "leaderboard_entries" violates check constraint "check_player_name_length"',
      details: "Failing row contains (Bing Cheng, medium, 6, ...)",
      hint: null,
    });
    await settle();

    expect(rows()).toEqual([
      {
        route: "POST /api/leaderboard",
        kind: "failed",
        message: 'new row for relation "leaderboard_entries" violates check constraint "check_player_name_length"',
        detail: { code: "23514" },
        deploy: null,
      },
    ]);
  });

  it("stores a string cause as the message, and anything else as Unknown error", async () => {
    const report = await freshReporter();

    report("GET /api/game-stats", "failed", "Failed to fetch metrics: timeout");
    report("GET /api/game-stats", "unexpected", 42);
    await settle();

    expect(rows()).toEqual([
      expect.objectContaining({ message: "Failed to fetch metrics: timeout", detail: {} }),
      expect.objectContaining({ message: "Unknown error", detail: {} }),
    ]);
  });

  it("strips emails, IP addresses, keys, tokens and query strings from the message and the detail", async () => {
    const report = await freshReporter();
    const leaky = [
      "contact bing@tont.app from 203.0.113.7 and 2001:db8:85a3:0:0:8a2e:370:7334",
      `key ${ANON_JWT} secret sb_secret_AbC123xyz_456 publishable sb_publishable_Zz9-8`,
      "Authorization: Bearer ya29.a0AfH6SMBx-token",
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----",
      "GET https://abc.supabase.co/rest/v1/leaderboard_entries?player_name=eq.Bing&select=* failed",
      "token 0123456789abcdef0123456789abcdef0123 end",
    ].join(" | ");

    report("POST /api/contact", "failed", new Error(leaky), { from: "bing@tont.app at 198.51.100.4" });
    await settle();

    expect(rows()).toEqual([
      expect.objectContaining({
        message: [
          "contact [email] from [ip] and [ip]",
          "key [jwt] secret [key] publishable [key]",
          "Authorization: Bearer [token]",
          "[private key]",
          "GET https://abc.supabase.co/rest/v1/leaderboard_entries?[query] failed",
          "token [token] end",
        ].join(" | "),
        detail: { name: "Error", from: "[email] at [ip]" },
      }),
    ]);
  });

  it("keeps times, ports and Postgres casts that look a little like addresses", async () => {
    const report = await freshReporter();

    report("GET /api/leaderboard", "unavailable", new Error("timeout at 12:30:45 on port 5432 for (60)::numeric"));
    await settle();

    expect(rows()).toEqual([expect.objectContaining({ message: "timeout at 12:30:45 on port 5432 for (60)::numeric" })]);
  });

  it.each([
    ["a full IPv6 address", "from 2001:db8:85a3:0:0:8a2e:370:7334 refused", "from [ip] refused"],
    ["a compressed link-local address", "connect fe80::1 failed", "connect [ip] failed"],
    ["the IPv6 loopback with a port", "connect ECONNREFUSED ::1:5432", "connect ECONNREFUSED [ip]"],
    ["a compressed address with a zone", "via fe80::1ff:fe23:4567:890a%eth0", "via [ip]%eth0"],
    ["a compressed address in brackets", "GET http://[2001:db8::7]/rest failed", "GET http://[[ip]]/rest failed"],
  ])("redacts %s", async (_, text, stored) => {
    const report = await freshReporter();

    report("GET /api/leaderboard", "unavailable", new Error(text));
    await settle();

    expect(rows()).toEqual([expect.objectContaining({ message: stored })]);
  });

  it.each([
    ["a time with four parts", "retry at 12:30:45:10 today"],
    ["a Postgres cast after a number", "cannot cast 60::bigint"],
    ["a Postgres cast to a date", "value '2026-10-19'::date is out of range"],
    ["a Postgres cast after a bracket", "(60)::numeric overflow"],
  ])("keeps %s", async (_, text) => {
    const report = await freshReporter();

    report("GET /api/leaderboard", "unavailable", new Error(text));
    await settle();

    expect(rows()).toEqual([expect.objectContaining({ message: text })]);
  });

  it("cuts by character, so an emoji at the cut is kept whole", async () => {
    const report = await freshReporter();

    report("POST /api/feedback", "failed", new Error(`${"a ".repeat(249)}😀😀😀`), { note: `${"b ".repeat(49)}😀😀😀` });
    await settle();

    expect(rows()).toEqual([
      expect.objectContaining({
        message: `${"a ".repeat(249)}😀…`,
        detail: { name: "Error", note: `${"b ".repeat(49)}😀…` },
      }),
    ]);
  });

  it("cuts the message to 500 characters and each detail text to 100, the last one an ellipsis", async () => {
    const report = await freshReporter();

    report("POST /api/feedback", "failed", new Error("ab ".repeat(200)), { note: "cd ".repeat(50) });
    await settle();

    expect(rows()).toEqual([
      expect.objectContaining({
        message: `${"ab ".repeat(166)}a…`,
        detail: { name: "Error", note: `${"cd ".repeat(33)}…` },
      }),
    ]);
  });

  it.each([
    ["the key is not set", { serviceKey: "" }],
    ["the key is the anon key", { serviceKey: ANON_JWT }],
    ["the key is not a JWT", { serviceKey: "sb_secret_AbC123xyz_456" }],
    ["Supabase is read-only", { readOnly: true }],
  ])("writes nothing, not even with the anon key, when %s", async (_, env) => {
    const report = await freshReporter(env);

    report("POST /api/leaderboard", "failed", new Error("fetch failed"));
    await settle();

    expect(inserts).toEqual([]);
  });

  it.each([
    ["the network is down", "networkDown", "TypeError: fetch failed"],
    ["the client throws", "throws", "Error: fetch is not a function"],
    ["Supabase refuses the row", "refused", "permission denied for table server_errors"],
  ] as const)("never throws when %s, and logs one line", async (_, failure, logged) => {
    const report = await freshReporter();
    outcome = failure;

    expect(report("POST /api/leaderboard", "failed", new Error("fetch failed"))).toBeUndefined();
    await settle();

    expect(error.mock.calls).toEqual([["Server error report not stored:", logged]]);
  });

  it("returns before the write finishes, and gives the write two seconds", async () => {
    const report = await freshReporter();
    outcome = "hangs";
    const timeout = jest.spyOn(AbortSignal, "timeout");

    expect(report("POST /api/leaderboard", "failed", new Error("fetch failed"))).toBeUndefined();
    await settle();

    expect(timeout.mock.calls).toEqual([[2000]]);
    expect(inserts.map(({ signal }) => signal.aborted)).toEqual([false]);
  });

  it("stores at most 20 reports a minute from one server, then starts again in the next minute", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick"], now: new Date("2026-10-18T12:00:00Z") });
    const report = await freshReporter();

    for (let n = 0; n < 25; n += 1) report("GET /api/leaderboard", "unavailable", new Error(`outage ${n}`));
    await settle();
    const firstMinute = inserts.length;
    jest.setSystemTime(new Date("2026-10-18T12:01:00Z"));
    report("GET /api/leaderboard", "unavailable", new Error("outage 25"));
    await settle();

    expect([firstMinute, inserts.length]).toEqual([20, 21]);
    expect(rows().at(-1)).toEqual(expect.objectContaining({ message: "outage 25" }));
  });

  it("keeps a separate budget for each route, so a flood on one route does not hide a failure on another", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick"], now: new Date("2026-10-18T12:00:00Z") });
    const report = await freshReporter();

    for (let n = 0; n < 30; n += 1) report("POST /api/feedback", "failed", new Error(`sheet ${n}`));
    report("leaderboard read", "unavailable", new Error("read timeout"));
    await settle();

    expect(rows().filter((row) => (row as { route: string }).route === "POST /api/feedback")).toHaveLength(20);
    expect(rows().at(-1)).toEqual(expect.objectContaining({ route: "leaderboard read", message: "read timeout" }));
  });
});
