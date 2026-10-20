/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../indexnow-lib.mjs";
import { waitForDeployment } from "../indexnow-deploy.mjs";

const SHA = "27be34ce4d99c594b072ab7dab427903b53e088c";
const MINUTE = 60_000;

type Listing = { id: number; environment: string };
type Statuses = Record<number, string[]>;

const production = (...ids: number[]): Listing[] => ids.map((id) => ({ id, environment: "Production" }));

function harness({ listings, statuses }: { listings: Listing[][]; statuses: Statuses[] }) {
  let clock = 0;
  let poll = 0;
  const calls: string[] = [];
  const logs: string[] = [];
  const api = async (path: string) => {
    calls.push(path);
    if (path.startsWith("/deployments?")) {
      const environment = new URLSearchParams(path.split("?")[1]).get("environment");
      const list = listings[Math.min(poll, listings.length - 1)];
      poll += 1;
      return list.filter((d) => d.environment === environment).map(({ id }) => ({ id }));
    }
    const id = Number(path.match(/^\/deployments\/(\d+)\/statuses$/)?.[1]);
    return (statuses[Math.min(poll - 1, statuses.length - 1)][id] ?? []).map((state) => ({ state }));
  };
  const options = {
    api,
    sha: SHA,
    now: () => clock,
    sleep: async (ms: number) => {
      clock += ms;
      if (clock > 60 * MINUTE) throw new Error("waited past an hour: a deadline branch is missing");
    },
    log: (m: string) => logs.push(m),
    pollMs: 20_000,
    timeoutMs: 15 * MINUTE,
  };
  return { options, calls, logs, elapsed: () => clock };
}

describe("waitForDeployment", () => {
  it("returns at once when the Production deployment of the sha already succeeded", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(0);
    expect(h.calls).toEqual([`/deployments?sha=${SHA}&environment=Production`, "/deployments/11/statuses"]);
  });

  it("waits through a 400 second build, where Vercel creates no deployment until it is ready", async () => {
    const h = harness({ listings: [[], ...Array(19).fill([]), production(11)], statuses: [{ 11: [] }, { 11: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(400_000);
  });

  it("waits while a deployment exists but has no status yet", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: [] }, { 11: [] }, { 11: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(40_000);
  });

  it("ignores a Preview deployment of the same sha", async () => {
    const h = harness({
      listings: [[{ id: 5, environment: "Preview" }], [{ id: 5, environment: "Preview" }, ...production(11)]],
      statuses: [{ 5: ["success"], 11: ["success"] }],
    });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(20_000);
    expect(h.calls).not.toContain("/deployments/5/statuses");
  });

  it("skips at once when Vercel canceled the deployment, which ends with a single inactive status", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: ["inactive"] }] });
    expect(await waitForDeployment(h.options)).toEqual({
      deployed: false,
      reason: "the Production deployment of 27be34ce4d99 was canceled",
    });
    expect(h.elapsed()).toBe(0);
  });

  it.each([
    ["failure", "ended with failure"],
    ["error", "ended with error"],
  ])("skips at once on %s", async (state, text) => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: [state] }] });
    expect(await waitForDeployment(h.options)).toEqual({
      deployed: false,
      reason: `the Production deployment of 27be34ce4d99 ${text}`,
    });
    expect(h.elapsed()).toBe(0);
  });

  it("keeps waiting for a redeploy that is still building when another deployment of the sha failed", async () => {
    const h = harness({
      listings: [production(11, 12)],
      statuses: [{ 11: ["failure"], 12: [] }, { 11: ["failure"], 12: [] }, { 11: ["failure"], 12: ["success"] }],
    });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(40_000);
  });

  it("still counts a deployment as live when a newer inactive status sits on top of success", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: ["inactive", "success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
  });

  it("accepts a redeploy that succeeded after a failed first try", async () => {
    const h = harness({ listings: [production(12, 11)], statuses: [{ 11: ["failure"], 12: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
  });

  it("gives up after 15 minutes when nothing succeeds, with no deployment or an unfinished one", async () => {
    for (const listing of [[], production(11)]) {
      const h = harness({ listings: [listing], statuses: [{ 11: [] }] });
      expect(await waitForDeployment(h.options)).toEqual({
        deployed: false,
        reason: "no successful Production deployment of 27be34ce4d99 within 15 minutes",
      });
      expect(h.elapsed()).toBe(15 * MINUTE);
    }
  });

  it("retries a failed API call until the deadline and still accepts a later success", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: ["success"] }] });
    let failures = 2;
    const api = async (path: string) => {
      if (failures-- > 0) throw new Error("GitHub answered 502.");
      return h.options.api(path);
    };
    expect(await waitForDeployment({ ...h.options, api })).toEqual({ deployed: true });
    expect(h.logs).toEqual(["GitHub answered 502.", "GitHub answered 502."]);
    expect(h.elapsed()).toBe(40_000);
  });

  it("does not stop early on API errors after a deployment was seen", async () => {
    const h = harness({ listings: [production(11)], statuses: [{ 11: [] }] });
    let calls = 0;
    const api = async (path: string) => {
      calls += 1;
      if (calls === 3) throw new Error("GitHub answered 502.");
      return h.options.api(path);
    };
    const result = await waitForDeployment({ ...h.options, api });
    expect(result.deployed).toBe(false);
    expect(h.elapsed()).toBe(15 * MINUTE);
  });
});

describe("indexnow-wait-deploy command line", () => {
  it("exits 1 without a token", () => {
    const result = spawnSync("node", [join(__dirname, "..", "indexnow-wait-deploy.mjs"), "--sha", SHA], {
      encoding: "utf8",
      env: { ...process.env, GITHUB_TOKEN: "", GITHUB_REPOSITORY: "o/r" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("GITHUB_TOKEN and GITHUB_REPOSITORY are required.\n");
  });

  it("writes deployed=false to GITHUB_OUTPUT and exits 0 when the API shows no deployment", () => {
    const dir = mkdtempSync(join(tmpdir(), "indexnow-wait-"));
    try {
      const output = join(dir, "out");
      const result = spawnSync("node", [join(__dirname, "..", "indexnow-wait-deploy.mjs"), "--sha", SHA, "--timeout-minutes", "0"], {
        timeout: 30_000,
        encoding: "utf8",
        env: { ...process.env, GITHUB_TOKEN: "t", GITHUB_REPOSITORY: "o/r", GITHUB_OUTPUT: output, GITHUB_API_URL: "http://127.0.0.1:9" },
      });
      expect(result.status).toBe(0);
      expect(readFileSync(output, "utf8")).toBe("deployed=false\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("INDEXNOW_ENDPOINT override", () => {
  it("posts to the endpoint passed in deps instead of the real one", async () => {
    const posts: string[] = [];
    const code = await run(["--urls", "https://thememorychess.com/a"], {
      endpoint: "http://127.0.0.1:9/stub",
      fetch: async (url: string) => (posts.push(url), new Response("", { status: 202 })),
      readFile: async () => "",
      writeFile: async () => undefined,
      mkdir: async () => undefined,
      log: () => undefined,
      error: () => undefined,
    });
    expect(code).toBe(0);
    expect(posts).toEqual(["http://127.0.0.1:9/stub"]);
  });
});
