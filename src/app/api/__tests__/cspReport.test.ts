/** @jest-environment node */
export {};

const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.fake-signature";
const ANON_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0Iiwicm9sZSI6ImFub24ifQ.fake-signature";

type Insert = { readonly key: string; readonly table: string; readonly row: Record<string, unknown> };

const inserts: Insert[] = [];
let tableMissing = false;

jest.mock("@supabase/supabase-js", () => ({
  createClient: (_url: string, key: string) => ({
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => ({
        abortSignal: () => {
          inserts.push({ key, table, row });
          return Promise.resolve({
            error: tableMissing ? { code: "PGRST205", message: "Could not find the table 'public.server_errors'" } : null,
          });
        },
      }),
    }),
  }),
}));

type Env = { readonly serviceKey?: string; readonly readOnly?: boolean };

async function freshRoute({ serviceKey = SERVICE_ROLE_JWT, readOnly = false }: Env = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_JWT;
  if (serviceKey === "") delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  if (readOnly) process.env.SUPABASE_READ_ONLY = "true";
  else delete process.env.SUPABASE_READ_ONLY;
  let route!: typeof import("@/app/api/csp-report/route");
  await jest.isolateModulesAsync(async () => {
    route = await import("@/app/api/csp-report/route");
  });
  return route.POST;
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function post(body: string, contentType = "application/csp-report", address = "203.0.113.7") {
  return new Request("https://thememorychess.com/api/csp-report", {
    method: "POST",
    headers: { "content-type": contentType, "x-forwarded-for": address },
    body,
  });
}

const reportUri = (fields: Record<string, unknown>) => JSON.stringify({ "csp-report": fields });
const reportingApi = (...bodies: Record<string, unknown>[]) =>
  JSON.stringify(bodies.map((body) => ({ type: "csp-violation", age: 0, url: String(body.documentURL), body })));

const INLINE_SCRIPT = {
  "document-uri": "https://thememorychess.com/en/game?token=secret&utm=x",
  "blocked-uri": "inline",
  "effective-directive": "script-src-elem",
  "violated-directive": "script-src-elem",
  disposition: "report",
  "script-sample": "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date());",
};

let warn: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  inserts.length = 0;
  tableMissing = false;
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  error = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/csp-report", () => {
  it("answers 204 and stores one trimmed row for a report-uri report", async () => {
    const POST = await freshRoute();

    const response = await POST(post(reportUri(INLINE_SCRIPT)));
    await settle();

    expect(response.status).toBe(204);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe("server_errors");
    expect(inserts[0].row).toMatchObject({
      route: "POST /api/csp-report",
      kind: "violation",
      message: "script-src-elem blocked inline",
      detail: { directive: "script-src-elem", blocked: "inline", path: "/en/game", disposition: "report", sample: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new D".slice(0, 80) },
    });
  });

  it("stores each violation of a Reporting API array, keeping the blocked origin only", async () => {
    const POST = await freshRoute();
    const body = reportingApi(
      { documentURL: "https://thememorychess.com/leaderboard?name=ann", blockedURL: "https://ads.example.net/a/b.js?id=7", effectiveDirective: "script-src-elem", disposition: "report" },
      { documentURL: "https://thememorychess.com/", blockedURL: "data", effectiveDirective: "img-src", disposition: "enforce" },
    );

    const response = await POST(post(body, "application/reports+json; charset=utf-8"));
    await settle();

    expect(response.status).toBe(204);
    expect(inserts.map(({ row }) => row.detail)).toEqual([
      { directive: "script-src-elem", blocked: "https://ads.example.net", path: "/leaderboard", disposition: "report" },
      { directive: "img-src", blocked: "data", path: "/", disposition: "enforce" },
    ]);
  });

  it("never stores a query string, a full blocked URL or a source file", async () => {
    const POST = await freshRoute();

    await POST(
      post(reportUri({ ...INLINE_SCRIPT, "blocked-uri": "https://cdn.example.org/x.js?key=abc", "source-file": "https://thememorychess.com/a.js?u=1" })),
    );
    await settle();

    const stored = JSON.stringify(inserts[0].row);
    expect(stored).not.toContain("?");
    expect(stored).not.toContain("secret");
    expect(stored).not.toContain("x.js");
    expect(stored).not.toContain("a.js");
  });

  it.each(["chrome-extension://abc/inject.js", "moz-extension://abc/x.js", "safari-web-extension://abc/x.js"])(
    "drops a report whose blocked URI is %s, and still answers 204",
    async (blocked) => {
      const POST = await freshRoute();

      const response = await POST(post(reportUri({ ...INLINE_SCRIPT, "blocked-uri": blocked })));
      await settle();

      expect(response.status).toBe(204);
      expect(inserts).toHaveLength(0);
    },
  );

  it("drops a report whose source file is an extension", async () => {
    const POST = await freshRoute();

    await POST(post(reportUri({ ...INLINE_SCRIPT, "source-file": "chrome-extension://abc/content.js" })));
    await settle();

    expect(inserts).toHaveLength(0);
  });

  it("writes with the service_role key only", async () => {
    const POST = await freshRoute();

    await POST(post(reportUri(INLINE_SCRIPT)));
    await settle();

    expect(inserts.map(({ key }) => key)).toEqual([SERVICE_ROLE_JWT]);
  });

  it.each([
    ["no service key", { serviceKey: "" }],
    ["the anon key as service key", { serviceKey: ANON_JWT }],
    ["SUPABASE_READ_ONLY", { readOnly: true }],
  ])("answers 204, writes nothing and logs once with %s", async (_name, env) => {
    const POST = await freshRoute(env);

    const first = await POST(post(reportUri(INLINE_SCRIPT)));
    const second = await POST(post(reportUri(INLINE_SCRIPT)));
    await settle();

    expect([first.status, second.status]).toEqual([204, 204]);
    expect(inserts).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("CSP reports are not stored");
  });

  it("answers 204 and logs when the table is missing", async () => {
    tableMissing = true;
    const POST = await freshRoute();

    const response = await POST(post(reportUri(INLINE_SCRIPT)));
    await settle();

    expect(response.status).toBe(204);
    expect(inserts).toHaveLength(1);
    expect(error).toHaveBeenCalledWith("Server error report not stored:", expect.stringContaining("server_errors"));
  });

  it("answers 415 to any other content type, without storing", async () => {
    const POST = await freshRoute();

    const response = await POST(post(reportUri(INLINE_SCRIPT), "application/json"));
    await settle();

    expect(response.status).toBe(415);
    expect(inserts).toHaveLength(0);
  });

  it("answers 413 to a body over 8 KB", async () => {
    const POST = await freshRoute();

    const response = await POST(post(reportUri({ ...INLINE_SCRIPT, "script-sample": "y".repeat(9000) })));
    await settle();

    expect(response.status).toBe(413);
    expect(inserts).toHaveLength(0);
  });

  it("answers 400 to a body that is not JSON", async () => {
    const POST = await freshRoute();

    expect((await POST(post("{nope"))).status).toBe(400);
  });

  it("answers 204 and stores nothing for JSON that holds no report", async () => {
    const POST = await freshRoute();

    const response = await POST(post(JSON.stringify({ hello: "world" })));
    await settle();

    expect(response.status).toBe(204);
    expect(inserts).toHaveLength(0);
  });

  it("answers 429 with Retry-After once an address passes 30 requests a minute, while another address still gets 204", async () => {
    const POST = await freshRoute({ readOnly: true });

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await POST(post(reportUri(INLINE_SCRIPT)))).status);
    const limited = await POST(post(reportUri(INLINE_SCRIPT)));
    const other = await POST(post(reportUri(INLINE_SCRIPT), "application/csp-report", "198.51.100.9"));

    expect(statuses.slice(0, 30).every((status) => status === 204)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(other.status).toBe(204);
  });
});
