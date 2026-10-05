/** @jest-environment node */

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type AuditRun, runAuditCli } from "./runAudit";

const PROD = "https://thememorychess.com";
const ARTICLE = "/articles/magnus-carlsen";
const GERMAN_ARTICLE = `/de${ARTICLE}`;
const ENGLISH_ONLY = ["/about", "/privacy", "/terms", "/contact-us"];
const LISTED = ["/", "/de", ...ENGLISH_ONLY, "/leaderboard", ARTICLE];
const ARTICLE_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>';
const NOTE = `<p data-authorship-note="true" data-translation-note="true">Mit KI übersetzt. <a hrefLang="en" href="${ARTICLE}">Auf Englisch lesen</a></p>`;

type PageParts = { robots?: string; head?: string; extra?: string };

function page(path: string, { robots = "index, follow", head = "", extra = "" }: PageParts = {}): string {
  const stem = path.replace(/\W/g, "") || "home";
  const text = Array.from({ length: 320 }, (_, i) => `${stem}${i}`).join(" ");
  const trustLinks = ENGLISH_ONLY.map((href) => `<a href="${href}">${href}</a>`).join("");
  return [
    `<html><head><title>${stem}</title><meta name="description" content="${stem} described"/>`,
    `<meta name="robots" content="${robots}"/><link rel="canonical" href="${PROD}${path}"/>${head}</head>`,
    `<body><main><h1>${stem}</h1><p>${text}</p>${extra}</main><footer>${trustLinks}</footer></body></html>`,
  ].join("");
}

function sitemap(): string {
  const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${PROD}/"/><xhtml:link rel="alternate" hreflang="de" href="${PROD}/de"/>`;
  const entries = LISTED.map((path) => `<url><loc>${PROD}${path}</loc>${path === "/" || path === "/de" ? alternates : ""}</url>`);
  return `<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join("")}</urlset>`;
}

/** A site that passes: English pages, a German home, a translated leaderboard without a note and a translated article with one. */
function passingSite(germanArticle: string): Record<string, string> {
  return {
    "/sitemap.xml": sitemap(),
    "/ads.txt": "google.com, pub-9048170183399377, DIRECT, f08c47fec0942fa0",
    ...Object.fromEntries(LISTED.map((path) => [path, page(path, { head: path === ARTICLE ? ARTICLE_SCHEMA : "" })])),
    "/de/leaderboard": page("/de/leaderboard", { robots: "noindex, follow" }),
    [GERMAN_ARTICLE]: germanArticle,
  };
}

const TRANSLATED_ARTICLE = page(GERMAN_ARTICLE, { robots: "noindex, follow", head: ARTICLE_SCHEMA, extra: NOTE });
const ARTICLE_WITHOUT_NOTE = page(GERMAN_ARTICLE, { robots: "noindex, follow", head: ARTICLE_SCHEMA });
const INDEXABLE_ARTICLE = page(GERMAN_ARTICLE, { head: ARTICLE_SCHEMA, extra: NOTE });

function redirectTarget(path: string): string | null {
  const bare = path.length > 1 ? path.replace(/\/$/, "") : path;
  const english = ENGLISH_ONLY.find((target) => bare === `/de${target}`);
  if (english) return english;
  return bare === path ? null : bare;
}

async function auditSite(site: Record<string, string>, flags: string[] = []): Promise<AuditRun & { json: () => Record<string, unknown> }> {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://stub").pathname;
    const target = redirectTarget(path);
    if (target) return response.writeHead(308, { location: target }).end();
    if (!(path in site)) return response.writeHead(404).end();
    return response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(site[path]);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const out = mkdtempSync(join(tmpdir(), "audit-adsense-run-"));
  try {
    const run = await runAuditCli(["--base", `http://127.0.0.1:${(server.address() as AddressInfo).port}`, "--out", out, ...flags]);
    const report = run.code === 2 ? "{}" : readFileSync(join(out, "audit.json"), "utf8");
    return { ...run, json: () => JSON.parse(report) };
  } finally {
    rmSync(out, { recursive: true, force: true });
    await new Promise((resolve) => server.close(resolve));
  }
}

const lines = (stdout: string) => stdout.trimEnd().split("\n");

describe("audit-adsense translated mode, run against a served site", () => {
  it("passes a site whose translated pages keep their promises and counts them on the summary line", async () => {
    const run = await auditSite(passingSite(TRANSLATED_ARTICLE));

    expect(lines(run.stdout).slice(1, 2)).toEqual(["8 sitemap URLs, 8 indexable, 2 locales, 0 broken internal links, 2 translated pages checked"]);
    expect(lines(run.stdout).slice(3, 6)).toEqual([
      "translated pages (noindex under a locale prefix): 2 checked against their English pages, 1 of them owing a translation note",
      "  words counted as space-separated words in de",
      "  blocks compared with the English page on the 1 that owes a note: h2, p, li, article card (the translation note and the view and like counts left out)",
    ]);
    expect(lines(run.stdout).filter((line) => line.startsWith("| translated-dropped-content"))).toEqual([
      "| translated-dropped-content | a translated page of written text has as many of each block (h2, p, li, article card) in main content as its English page | 0 |  |",
    ]);
    expect(lines(run.stdout).at(-1)).toBe("PASS");
    expect(run.code).toBe(0);
  });

  it("fails a site whose translated article dropped a section, naming the blocks that differ", async () => {
    const english = page(ARTICLE, { head: ARTICLE_SCHEMA, extra: "<h2>One</h2><p>First</p><h2>Two</h2><p>Second</p>" });
    const german = page(GERMAN_ARTICLE, { robots: "noindex, follow", head: ARTICLE_SCHEMA, extra: `<h2>Eins</h2><p>Erster</p>${NOTE}` });
    const run = await auditSite({ ...passingSite(german), [ARTICLE]: english });

    expect(lines(run.stdout).slice(-5)).toEqual([
      "Failing pages:",
      `  ${GERMAN_ARTICLE}`,
      `    [translated-dropped-content] 1 h2 where ${ARTICLE} has 2, 2 p where it has 3`,
      "",
      "FAIL: 1 pages and 0 site checks",
    ]);
    expect(run.code).toBe(1);
  });

  it("fails a site whose listed page links to an indexable page the sitemap does not list", async () => {
    const run = await auditSite({
      ...passingSite(TRANSLATED_ARTICLE),
      "/": page("/", { extra: '<a href="/settings">Settings</a>' }),
      "/settings": page("/settings"),
    });

    expect(lines(run.stdout).filter((line) => line.startsWith("| unlisted-indexable"))).toEqual([
      "| unlisted-indexable | site | 1 | /settings is linked and indexable but missing from the sitemap |",
    ]);
    expect(lines(run.stdout).at(-1)).toBe("FAIL: 0 pages and 1 site checks");
    expect(run.code).toBe(1);
  });

  it("writes each translated page and its findings to audit.json", async () => {
    const report = (await auditSite(passingSite(ARTICLE_WITHOUT_NOTE))).json() as {
      summary: { urls: number; translated: number };
      translated: Array<{ path: string; english: string; words: number; blocks: unknown; englishBlocks: unknown; owesNote: boolean; findings: unknown[] }>;
      pages: Array<{ path: string; blocks: unknown }>;
    };
    const ONE_PARAGRAPH = { h2: 0, p: 1, li: 0, "article card": 0 };

    expect({ urls: report.summary.urls, translated: report.summary.translated }).toEqual({ urls: 8, translated: 2 });
    expect(report.pages.find((p) => p.path === ARTICLE)?.blocks).toEqual(ONE_PARAGRAPH);
    expect(report.translated.map(({ path, english, words, blocks, englishBlocks, owesNote, findings }) => ({ path, english, words, blocks, englishBlocks, owesNote, findings }))).toEqual([
      { path: "/de/leaderboard", english: "/leaderboard", words: 322, blocks: ONE_PARAGRAPH, englishBlocks: ONE_PARAGRAPH, owesNote: false, findings: [] },
      {
        path: GERMAN_ARTICLE,
        english: ARTICLE,
        words: 322,
        blocks: ONE_PARAGRAPH,
        englishBlocks: ONE_PARAGRAPH,
        owesNote: true,
        findings: [{ rule: "translation-note", message: `no translation note (data-translation-note), though ${ARTICLE} declares a schema.org Article` }],
      },
    ]);
  });

  it("fails with exit 1 and lists a translated page that breaks a promise under Failing pages", async () => {
    const run = await auditSite(passingSite(ARTICLE_WITHOUT_NOTE));

    expect(lines(run.stdout).slice(-5)).toEqual([
      "Failing pages:",
      `  ${GERMAN_ARTICLE}`,
      `    [translation-note] no translation note (data-translation-note), though ${ARTICLE} declares a schema.org Article`,
      "",
      "FAIL: 1 pages and 0 site checks",
    ]);
    expect(run.code).toBe(1);
  });

  it("checks no translated page when the mode is turned off, and says so", async () => {
    const run = await auditSite(passingSite(ARTICLE_WITHOUT_NOTE), ["--translated", "off"]);

    expect(lines(run.stdout).slice(1, 2)).toEqual(["8 sitemap URLs, 8 indexable, 2 locales, 0 broken internal links, translated pages not checked (--translated off)"]);
    expect(run.stdout).not.toContain("translation-note");
    expect(lines(run.stdout).at(-1)).toBe("PASS");
    expect(run.code).toBe(0);
  });

  it("fails a translated article that is indexable, by its URL, and no longer counts it as translated", async () => {
    const run = await auditSite(passingSite(INDEXABLE_ARTICLE));

    expect(lines(run.stdout).slice(1, 2)).toEqual(["8 sitemap URLs, 8 indexable, 2 locales, 0 broken internal links, 1 translated page checked"]);
    expect(lines(run.stdout).filter((line) => line.includes(GERMAN_ARTICLE))).toEqual([
      `| locale-prefix-redirect | G28 crawlable canonical URLs | 1 | ${GERMAN_ARTICLE} answers 200, expected 308; chain ${GERMAN_ARTICLE} 200 |`,
      expect.stringMatching(new RegExp(`^\\| locale-prefix-redirect \\| G28 crawlable canonical URLs \\| 1 \\| ${GERMAN_ARTICLE}/ redirects to http://127\\.0\\.0\\.1:\\d+${GERMAN_ARTICLE}, expected `)),
    ]);
    expect(lines(run.stdout).at(-1)).toBe("FAIL: 0 pages and 2 site checks");
    expect(run.code).toBe(1);
  });

  it("refuses a value for --translated that is neither on nor off", async () => {
    const run = await auditSite(passingSite(TRANSLATED_ARTICLE), ["--translated", "maybe"]);

    expect(run.stderr.trim()).toBe('Cannot audit: --translated takes on or off, got "maybe"');
    expect(run.code).toBe(2);
  });
});
