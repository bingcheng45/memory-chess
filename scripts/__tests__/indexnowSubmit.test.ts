/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_URLS, buildPayload, parseSitemap, planSubmission, run } from "../indexnow-lib.mjs";

const ROOT = join(__dirname, "..", "..");
const SCRIPT = join(ROOT, "scripts", "indexnow-submit.mjs");
const KEY = "5a02a3bb61bac459c5a10034038b50f9";
const HOME = "https://thememorychess.com";

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url>
<loc>https://thememorychess.com/</loc>
<xhtml:link rel="alternate" hreflang="en" href="https://thememorychess.com/" />
<xhtml:link rel="alternate" hreflang="es" href="https://thememorychess.com/es" />
<lastmod>2026-10-14T00:00:00.000Z</lastmod>
<changefreq>weekly</changefreq>
</url>
<url>
<loc>https://thememorychess.com/es</loc>
<xhtml:link rel="alternate" hreflang="en" href="https://thememorychess.com/" />
<lastmod>2026-10-14T00:00:00.000Z</lastmod>
</url>
<url>
<loc>https://thememorychess.com/de/game?a=1&amp;b=2</loc>
<lastmod>2026-10-19T00:00:00.000Z</lastmod>
</url>
<url><loc>https://thememorychess.com/learn/no-date</loc></url>
</urlset>`;

describe("parseSitemap", () => {
  it("reads loc and lastmod per url, ignoring xhtml alternates and decoding entities", () => {
    expect(parseSitemap(SITEMAP)).toEqual([
      { url: `${HOME}/`, lastmod: "2026-10-14T00:00:00.000Z" },
      { url: `${HOME}/es`, lastmod: "2026-10-14T00:00:00.000Z" },
      { url: `${HOME}/de/game?a=1&b=2`, lastmod: "2026-10-19T00:00:00.000Z" },
      { url: `${HOME}/learn/no-date`, lastmod: undefined },
    ]);
  });

  it("lists a repeated url once", () => {
    const xml = `<urlset><url><loc>${HOME}/a</loc></url><url><loc>${HOME}/a</loc></url></urlset>`;
    expect(parseSitemap(xml)).toEqual([{ url: `${HOME}/a`, lastmod: undefined }]);
  });
});

describe("planSubmission", () => {
  const old = "2026-10-01T00:00:00.000Z";
  const mid = "2026-10-10T00:00:00.000Z";
  const recent = "2026-10-19T00:00:00.000Z";

  it("submits everything and records it when there is no previous state", () => {
    const plan = planSubmission(
      [
        { url: `${HOME}/a`, lastmod: old },
        { url: `${HOME}/b`, lastmod: undefined },
      ],
      {},
    );
    expect(plan.changed).toEqual([`${HOME}/a`, `${HOME}/b`]);
    expect(plan.next).toEqual({ [`${HOME}/a`]: old, [`${HOME}/b`]: "" });
  });

  it("skips unchanged urls, submits changed and new ones, and forgets removed ones", () => {
    const plan = planSubmission(
      [
        { url: `${HOME}/unchanged`, lastmod: mid },
        { url: `${HOME}/changed`, lastmod: recent },
        { url: `${HOME}/new`, lastmod: old },
      ],
      { [`${HOME}/unchanged`]: mid, [`${HOME}/changed`]: old, [`${HOME}/removed`]: old },
    );
    expect(plan.changed).toEqual([`${HOME}/changed`, `${HOME}/new`]);
    expect(plan.next).toEqual({ [`${HOME}/unchanged`]: mid, [`${HOME}/changed`]: recent, [`${HOME}/new`]: old });
  });

  it("never resubmits when the plan's next state is planned against the same sitemap again", () => {
    const entries = [
      { url: `${HOME}/a`, lastmod: mid },
      { url: `${HOME}/b`, lastmod: undefined },
    ];
    const first = planSubmission(entries, {});
    expect(planSubmission(entries, first.next).changed).toEqual([]);
  });

  it("does not submit a url whose lastmod moved backwards and keeps the recorded value", () => {
    const plan = planSubmission([{ url: `${HOME}/a`, lastmod: old }], { [`${HOME}/a`]: recent });
    expect(plan.changed).toEqual([]);
    expect(plan.next).toEqual({ [`${HOME}/a`]: recent });
  });

  it("does not submit a known url that has no lastmod", () => {
    expect(planSubmission([{ url: `${HOME}/a`, lastmod: undefined }], { [`${HOME}/a`]: "" }).changed).toEqual([]);
  });

  it("submits a known url that gained a lastmod", () => {
    expect(planSubmission([{ url: `${HOME}/a`, lastmod: mid }], { [`${HOME}/a`]: "" }).changed).toEqual([`${HOME}/a`]);
  });
});

describe("buildPayload", () => {
  it("names the host, key and key file location", () => {
    expect(buildPayload([`${HOME}/a`])).toEqual({
      host: "thememorychess.com",
      key: KEY,
      keyLocation: `${HOME}/${KEY}.txt`,
      urlList: [`${HOME}/a`],
    });
  });

  it("accepts exactly 10,000 urls and rejects 10,001", () => {
    const urls = (n: number) => Array.from({ length: n }, (_, i) => `${HOME}/p/${i}`);
    expect(MAX_URLS).toBe(10_000);
    expect(buildPayload(urls(10_000)).urlList).toHaveLength(10_000);
    expect(() => buildPayload(urls(10_001))).toThrow("10001 URLs exceeds the IndexNow limit of 10000.");
  });

  it("rejects a url on another host and an empty list", () => {
    expect(() => buildPayload(["https://memory-chess.vercel.app/"])).toThrow("not on thememorychess.com");
    expect(() => buildPayload([])).toThrow("No URLs to submit.");
  });
});

describe("run", () => {
  const SITEMAP_URL = "https://stub.test/sitemap.xml";
  const STATE = "/state/indexnow.json";

  function harness({ status = 200, body = "", state }: { status?: number; body?: string; state?: string }) {
    const files = new Map<string, string>();
    if (state !== undefined) files.set(STATE, state);
    const posts: { url: string; body: unknown }[] = [];
    const out: string[] = [];
    const err: string[] = [];
    const fetch = async (url: string, init?: { body?: string }) => {
      if (url === SITEMAP_URL) return new Response(SITEMAP, { status: 200 });
      posts.push({ url, body: JSON.parse(init?.body ?? "null") });
      return new Response(body, { status });
    };
    const fs = {
      readFile: async (path: string) => {
        const text = files.get(path);
        if (text === undefined) throw Object.assign(new Error("missing"), { code: "ENOENT" });
        return text;
      },
      writeFile: async (path: string, text: string) => void files.set(path, text),
      mkdir: async () => undefined,
    };
    const exec = (...args: string[]) =>
      run(["--sitemap", SITEMAP_URL, ...args], { fetch, ...fs, log: (m: string) => out.push(m), error: (m: string) => err.push(m) });
    return { exec, files, posts, out, err };
  }

  it("on the first run submits every sitemap url once and saves the state", async () => {
    const h = harness({ status: 200 });
    expect(await h.exec("--state", STATE)).toBe(0);
    expect(h.posts).toHaveLength(1);
    expect(h.posts[0].url).toBe("https://api.indexnow.org/indexnow");
    expect((h.posts[0].body as { urlList: string[] }).urlList).toEqual([
      `${HOME}/`,
      `${HOME}/es`,
      `${HOME}/de/game?a=1&b=2`,
      `${HOME}/learn/no-date`,
    ]);
    expect(JSON.parse(h.files.get(STATE) as string)).toEqual({
      [`${HOME}/`]: "2026-10-14T00:00:00.000Z",
      [`${HOME}/es`]: "2026-10-14T00:00:00.000Z",
      [`${HOME}/de/game?a=1&b=2`]: "2026-10-19T00:00:00.000Z",
      [`${HOME}/learn/no-date`]: "",
    });
  });

  it("a second run against the same sitemap posts nothing", async () => {
    const first = harness({ status: 202 });
    await first.exec("--state", STATE);
    const second = harness({ state: first.files.get(STATE) });
    expect(await second.exec("--state", STATE)).toBe(0);
    expect(second.posts).toEqual([]);
    expect(second.out).toEqual(["No sitemap URL changed since the last submission; nothing to submit."]);
  });

  it("submits only the url whose lastmod is newer than the saved state", async () => {
    const state = JSON.stringify({
      [`${HOME}/`]: "2026-10-14T00:00:00.000Z",
      [`${HOME}/es`]: "2026-10-14T00:00:00.000Z",
      [`${HOME}/de/game?a=1&b=2`]: "2026-10-10T00:00:00.000Z",
      [`${HOME}/learn/no-date`]: "",
    });
    const h = harness({ state });
    expect(await h.exec("--state", STATE)).toBe(0);
    expect((h.posts[0].body as { urlList: string[] }).urlList).toEqual([`${HOME}/de/game?a=1&b=2`]);
    expect(JSON.parse(h.files.get(STATE) as string)[`${HOME}/de/game?a=1&b=2`]).toBe("2026-10-19T00:00:00.000Z");
  });

  it("--all submits everything even when the state says nothing changed", async () => {
    const first = harness({});
    await first.exec("--state", STATE);
    const again = harness({ state: first.files.get(STATE) });
    expect(await again.exec("--state", STATE, "--all")).toBe(0);
    expect((again.posts[0].body as { urlList: string[] }).urlList).toHaveLength(4);
  });

  it("treats an unreadable state file as empty", async () => {
    const h = harness({ state: "not json" });
    expect(await h.exec("--state", STATE)).toBe(0);
    expect((h.posts[0].body as { urlList: string[] }).urlList).toHaveLength(4);
    expect(h.err[0]).toContain("ignoring unreadable state");
  });

  it.each([
    [400, "Bad request: the payload is not valid JSON or a field is missing."],
    [403, "Forbidden: the key is not valid, or the key file was not found at keyLocation."],
    [422, "Unprocessable: a URL does not belong to the host, or the key does not match the schema."],
    [429, "Too many requests: the host was flagged as potential spam, or submissions are too frequent."],
  ])("on %i prints the body and the meaning, exits 1 and keeps the old state", async (status, meaning) => {
    const h = harness({ status, body: '{"detail":"nope"}' });
    expect(await h.exec("--state", STATE)).toBe(1);
    expect(h.err).toEqual([`IndexNow answered ${status} for 4 URLs. ${meaning}`, 'Response body: {"detail":"nope"}']);
    expect(h.files.has(STATE)).toBe(false);
  });

  it("exits 1 with a generic message on another status", async () => {
    const h = harness({ status: 500, body: "" });
    expect(await h.exec("--state", STATE)).toBe(1);
    expect(h.err[0]).toBe("IndexNow answered 500 for 4 URLs. Unexpected status.");
    expect(h.err[1]).toBe("Response body: (empty)");
  });

  it("exits 0 on 200 and 202", async () => {
    expect(await harness({ status: 200 }).exec()).toBe(0);
    expect(await harness({ status: 202 }).exec()).toBe(0);
  });

  it("dry run prints the payload, posts nothing and writes no state", async () => {
    const h = harness({});
    expect(await h.exec("--state", STATE, "--dry-run")).toBe(0);
    expect(h.posts).toEqual([]);
    expect(h.files.has(STATE)).toBe(false);
    expect(JSON.parse(h.out[0]).urlList).toHaveLength(4);
  });

  it("--urls submits exactly those urls and never touches the state", async () => {
    const h = harness({});
    expect(await h.exec("--state", STATE, "--urls", `${HOME}/about,${HOME}/daily`)).toBe(0);
    expect((h.posts[0].body as { urlList: string[] }).urlList).toEqual([`${HOME}/about`, `${HOME}/daily`]);
    expect(h.files.has(STATE)).toBe(false);
  });

  it("fails with exit 1 when the sitemap cannot be fetched", async () => {
    const err: string[] = [];
    const code = await run(["--sitemap", SITEMAP_URL], {
      fetch: async () => new Response("", { status: 503 }),
      readFile: async () => "",
      writeFile: async () => undefined,
      mkdir: async () => undefined,
      log: () => undefined,
      error: (m: string) => err.push(m),
    });
    expect(code).toBe(1);
    expect(err).toEqual([`${SITEMAP_URL} answered 503.`]);
  });
});

describe("command line", () => {
  let dir: string;
  let sitemapPath: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "indexnow-"));
    sitemapPath = join(dir, "sitemap.xml");
    writeFileSync(sitemapPath, SITEMAP);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("prints the dry-run payload for a sitemap file and exits 0", () => {
    const result = spawnSync("node", [SCRIPT, "--dry-run", "--sitemap", sitemapPath], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).urlList).toEqual([
      `${HOME}/`,
      `${HOME}/es`,
      `${HOME}/de/game?a=1&b=2`,
      `${HOME}/learn/no-date`,
    ]);
  });

  it("exits 1 on an unknown argument", () => {
    const result = spawnSync("node", [SCRIPT, "--bogus"], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Unknown argument --bogus.\n");
  });
});

describe("key file", () => {
  it("holds exactly the key, named after it", () => {
    expect(readFileSync(join(ROOT, "public", `${KEY}.txt`), "utf8")).toBe(KEY);
  });

  it("is the only key file in public", () => {
    expect(readdirSync(join(ROOT, "public")).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f))).toEqual([`${KEY}.txt`]);
  });
});
