/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../indexnow-lib.mjs";
import { waitForDeployment } from "../indexnow-deploy.mjs";

const SHA = "27be34ce4d99c594b072ab7dab427903b53e088c";
const MINUTE = 60_000;

type Statuses = Record<number, string[]>;

function harness({ deployments, statuses }: { deployments: number[][]; statuses: Statuses[] }) {
  let clock = 0;
  let poll = 0;
  const calls: string[] = [];
  const logs: string[] = [];
  const api = async (path: string) => {
    calls.push(path);
    if (path === `/deployments?sha=${SHA}&environment=Production`) {
      const list = deployments[Math.min(poll, deployments.length - 1)];
      poll += 1;
      return list.map((id) => ({ id }));
    }
    const id = Number(path.match(/^\/deployments\/(\d+)\/statuses$/)?.[1]);
    return (statuses[Math.min(poll - 1, statuses.length - 1)][id] ?? []).map((state) => ({ state }));
  };
  const options = {
    api,
    sha: SHA,
    now: () => clock,
    sleep: async (ms: number) => void (clock += ms),
    log: (m: string) => logs.push(m),
    pollMs: 20_000,
    noDeploymentMs: 6 * MINUTE,
    timeoutMs: 15 * MINUTE,
  };
  return { options, calls, logs, elapsed: () => clock };
}

describe("waitForDeployment", () => {
  it("returns at once when the Production deployment of the sha already succeeded", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(0);
    expect(h.calls).toEqual([`/deployments?sha=${SHA}&environment=Production`, "/deployments/11/statuses"]);
  });

  it("waits through pending and in_progress, then succeeds", async () => {
    const h = harness({
      deployments: [[11]],
      statuses: [{ 11: [] }, { 11: ["pending"] }, { 11: ["in_progress", "queued"] }, { 11: ["success", "in_progress"] }],
    });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(60_000);
  });

  it("waits for a deployment that appears a minute after the push", async () => {
    const h = harness({ deployments: [[], [], [], [11]], statuses: [{ 11: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
    expect(h.elapsed()).toBe(60_000);
  });

  it("gives up without submitting when the build failed", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["pending"] }, { 11: ["failure", "pending"] }] });
    const result = await waitForDeployment(h.options);
    expect(result).toEqual({ deployed: false, reason: "the Production deployment of 27be34ce4d99 ended with failure" });
  });

  it("gives up on an errored deployment too", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["error"] }] });
    expect((await waitForDeployment(h.options)).deployed).toBe(false);
  });

  it("gives up after 6 minutes when no Production deployment ever appears, as when the build is skipped", async () => {
    const h = harness({ deployments: [[]], statuses: [{}] });
    expect(await waitForDeployment(h.options)).toEqual({
      deployed: false,
      reason: "no Production deployment of 27be34ce4d99 appeared within 6 minutes",
    });
    expect(h.elapsed()).toBe(6 * MINUTE);
  });

  it("gives up after 15 minutes when the build never finishes", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["in_progress"] }] });
    expect(await waitForDeployment(h.options)).toEqual({
      deployed: false,
      reason: "the Production deployment of 27be34ce4d99 did not finish within 15 minutes",
    });
    expect(h.elapsed()).toBe(15 * MINUTE);
  });

  it("accepts a redeploy of the same sha that succeeded after a failed first try", async () => {
    const h = harness({ deployments: [[12, 11]], statuses: [{ 11: ["failure"], 12: ["success"] }] });
    expect(await waitForDeployment(h.options)).toEqual({ deployed: true });
  });

  it("keeps waiting to the 15 minute deadline when an API call fails after a deployment was seen", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["in_progress"] }] });
    let calls = 0;
    const api = async (path: string) => {
      calls += 1;
      if (calls === 3) throw new Error("GitHub answered 502.");
      return h.options.api(path);
    };
    const result = await waitForDeployment({ ...h.options, api, noDeploymentMs: 0 });
    expect(result).toEqual({
      deployed: false,
      reason: "the Production deployment of 27be34ce4d99 did not finish within 15 minutes",
    });
    expect(h.elapsed()).toBe(15 * MINUTE);
  });

  it("keeps polling through a failed API call", async () => {
    const h = harness({ deployments: [[11]], statuses: [{ 11: ["success"] }] });
    let first = true;
    const api = async (path: string) => {
      if (first) {
        first = false;
        throw new Error("GitHub answered 502.");
      }
      return h.options.api(path);
    };
    expect(await waitForDeployment({ ...h.options, api })).toEqual({ deployed: true });
    expect(h.logs).toContain("GitHub answered 502.");
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
      const result = spawnSync("node", [join(__dirname, "..", "indexnow-wait-deploy.mjs"), "--sha", SHA, "--no-deployment-minutes", "0"], {
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
