/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const SCRIPT = join(ROOT, "scripts", "indexnow-submit.mjs");
const KEY = "5a02a3bb61bac459c5a10034038b50f9";

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://thememorychess.com</loc><lastmod>2026-10-14T00:00:00.000Z</lastmod></url>
<url><loc>https://thememorychess.com/learn/blindfold-chess</loc><lastmod>2026-10-01T00:00:00.000Z</lastmod></url>
<url><loc>https://thememorychess.com/de/game?a=1&amp;b=2</loc><lastmod>2026-10-19T00:00:00.000Z</lastmod></url>
</urlset>`;

let dir: string;
let sitemapPath: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "indexnow-"));
  sitemapPath = join(dir, "sitemap.xml");
  writeFileSync(sitemapPath, SITEMAP);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function dryRun(...args: string[]) {
  const run = spawnSync("node", [SCRIPT, "--dry-run", "--sitemap", sitemapPath, ...args], { encoding: "utf8" });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

describe("indexnow-submit payload", () => {
  it("lists every sitemap URL under the site host with the key file location", () => {
    const run = dryRun();
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual({
      host: "thememorychess.com",
      key: KEY,
      keyLocation: `https://thememorychess.com/${KEY}.txt`,
      urlList: [
        "https://thememorychess.com",
        "https://thememorychess.com/learn/blindfold-chess",
        "https://thememorychess.com/de/game?a=1&b=2",
      ],
    });
  });

  it("submits only the URLs given with --urls", () => {
    const run = dryRun("--urls", "https://thememorychess.com/about,https://thememorychess.com/daily");
    expect(JSON.parse(run.stdout).urlList).toEqual(["https://thememorychess.com/about", "https://thememorychess.com/daily"]);
  });

  it("keeps only URLs modified on or after --since", () => {
    const run = dryRun("--since", "2026-10-14");
    expect(JSON.parse(run.stdout).urlList).toEqual(["https://thememorychess.com", "https://thememorychess.com/de/game?a=1&b=2"]);
  });

  it("rejects a URL on another host", () => {
    const run = dryRun("--urls", "https://memory-chess.vercel.app/");
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("not on thememorychess.com");
  });

  it("exits cleanly when nothing changed since the cutoff", () => {
    const run = dryRun("--since", "2030-01-01");
    expect(run.status).toBe(0);
    expect(run.stdout).toBe("No sitemap URL changed since 2030-01-01; nothing to submit.\n");
  });

  it("rejects an empty --urls list", () => {
    const run = dryRun("--urls", ",");
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("No URLs to submit");
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
