/** @jest-environment node */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const AUDIT_PATH = join(__dirname, "..", "audit-adsense.mjs");
const AUDIT_URL = pathToFileURL(AUDIT_PATH).href;

/**
 * Runs an export of the real audit script in a separate Node process, since the
 * script is an ES module Jest does not load, and returns what it printed.
 */
function runAudit(expression: string): string {
  const program = `const audit = await import(${JSON.stringify(AUDIT_URL)}); process.stdout.write(String(${expression}));`;
  return execFileSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8" });
}

const hiddenTextOf = (html: string) => runAudit(`audit.hiddenText(${JSON.stringify(html)})`);

describe("audit-adsense hidden text", () => {
  it.each([
    ["a bare hidden class", '<p class="hidden text-sm">Five words hidden from readers</p>'],
    ["a bare invisible class", '<p class="invisible">Five words hidden from readers</p>'],
    ["a breakpoint hidden class", '<p class="block md:hidden">Five words hidden from readers</p>'],
    ["a breakpoint hidden class alone", '<p class="lg:hidden">Five words hidden from readers</p>'],
    ["a small-breakpoint invisible class", '<p class="sm:invisible">Five words hidden from readers</p>'],
    ["a medium-breakpoint invisible class", '<p class="text-sm md:invisible">Five words hidden from readers</p>'],
    ["invisible that a breakpoint display class cannot show", '<p class="invisible sm:block">Five words hidden from readers</p>'],
    ["hidden that a breakpoint visible class cannot show", '<p class="hidden md:visible">Five words hidden from readers</p>'],
    ["the hidden attribute on an inactive panel", '<div data-state="inactive" hidden="">Five words hidden from readers</div>'],
  ])("counts text behind %s", (_, html) => {
    expect(hiddenTextOf(html)).toBe("Five words hidden from readers");
  });

  it.each([
    ["hidden shown again from a breakpoint", '<p class="hidden pt-6 sm:block">Five words shown on wide screens</p>'],
    ["hidden shown again as inline-flex", '<p class="hidden lg:inline-flex">Five words shown on wide screens</p>'],
    ["invisible made visible from a breakpoint", '<p class="invisible md:visible">Five words shown on wide screens</p>'],
    ["an inactive panel that only a Radix class would hide", '<div data-state="inactive" class="data-[state=inactive]:hidden">Five words shown on wide screens</div>'],
    ["aria-hidden", '<p aria-hidden="true">Five words shown on wide screens</p>'],
  ])("does not count text behind %s", (_, html) => {
    expect(hiddenTextOf(html)).toBe("");
  });
});

describe("audit-adsense hidden-text rule report", () => {
  it("names every viewport and every way text is hidden", () => {
    const report = JSON.parse(
      runAudit(
        `JSON.stringify((({ guideline, check }) => ({ guideline, messages: check({ hiddenWords: 5, mainWords: 300 }) }))(audit.RULES.find((rule) => rule.id === "hidden-text")))`,
      ),
    );

    expect(report.guideline).toBe("G19 no text hidden at any viewport");
    expect(report.messages).toEqual([
      "5 of 300 words ship hidden (inline style, hidden attribute, hidden class, or breakpoint-hidden class)",
    ]);
  });
});

describe("audit-adsense command line", () => {
  it("runs the audit when started through a symlink, so an unreachable base fails loudly", () => {
    const dir = mkdtempSync(join(tmpdir(), "audit-adsense-"));
    try {
      const link = join(dir, "audit-adsense.mjs");
      symlinkSync(AUDIT_PATH, link);

      const run = spawnSync(process.execPath, [link, "--base", "http://127.0.0.1:1"], { encoding: "utf8" });

      expect(run.stderr).not.toBe("");
      expect(run.status).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("audit-adsense hreflang targets", () => {
  const LOCAL = "http://127.0.0.1:4517";
  const htmlAlternates = [
    '<link rel="alternate" hrefLang="en" href="https://thememorychess.com"/>',
    '<link rel="alternate" hrefLang="de" href="https://thememorychess.com/de"/>',
    '<link rel="alternate" hrefLang="x-default" href="https://thememorychess.com"/>',
  ].join("");
  const linkHeader = (entries: Array<[string, string]>) =>
    entries.map(([lang, href]) => `<${href}>; rel="alternate"; hreflang="${lang}"`).join(", ");

  function hreflangProblems(html: string, header?: string): string[] {
    const page = header === undefined ? `audit.parsePage(url, 200, html)` : `audit.parsePage(url, 200, html, ${JSON.stringify(header)})`;
    return JSON.parse(
      runAudit(
        `(() => { const url = ${JSON.stringify(`${LOCAL}/de`)}; const html = ${JSON.stringify(html)}; const rule = audit.RULES.find((r) => r.id === "hreflang-targets"); return JSON.stringify([...rule.site([${page}], { listed: new Set([${JSON.stringify(LOCAL)}, ${JSON.stringify(`${LOCAL}/de`)}]) }).values()].flat()); })()`,
      ),
    );
  }

  it("passes when the Link header matches the HTML except for a root trailing slash", () => {
    const header = linkHeader([["en", `${LOCAL}/`], ["de", `${LOCAL}/de`], ["x-default", `${LOCAL}/`]]);

    expect(hreflangProblems(htmlAlternates, header)).toEqual([]);
  });

  it("passes when the page sends no Link header", () => {
    expect(hreflangProblems(htmlAlternates)).toEqual([]);
  });

  it("fails when the Link header names a different URL for a code", () => {
    const header = linkHeader([["en", `${LOCAL}/`], ["de", `${LOCAL}/`], ["x-default", `${LOCAL}/`]]);

    expect(hreflangProblems(htmlAlternates, header)).toEqual([expect.stringContaining(`de header ${LOCAL}/ vs HTML ${LOCAL}/de`)]);
  });

  it("fails when the Link header misses a code the HTML names", () => {
    const header = linkHeader([["en", `${LOCAL}/`], ["de", `${LOCAL}/de`]]);

    expect(hreflangProblems(htmlAlternates, header)).toEqual([expect.stringContaining("x-default header none")]);
  });

  it("fails when the Link header names a code the HTML does not", () => {
    const header = linkHeader([["en", `${LOCAL}/`], ["de", `${LOCAL}/de`], ["x-default", `${LOCAL}/`], ["fr", `${LOCAL}/de`]]);

    expect(hreflangProblems(htmlAlternates, header)).toEqual([expect.stringContaining(`fr header ${LOCAL}/de vs HTML none`)]);
  });

  it("fails when a Link header alternate points at a page the sitemap does not list", () => {
    const header = linkHeader([["fr", `${LOCAL}/fr`]]);

    expect(hreflangProblems("", header)).toEqual([expect.stringContaining(`fr ${LOCAL}/fr`)]);
  });
});

describe("audit-adsense boilerplate prose", () => {
  it("drops the authorship note, citations and link text but keeps the byline", () => {
    const html = [
      "<main>",
      '<address data-learn-byline="true">By <a href="/about">Bing Cheng</a>.</address>',
      '<p data-authorship-note="true">Written with AI assistance and checked by script.</p>',
      "<p>Guide prose stays in the count.</p>",
      '<cite><a href="https://example.com">A cited paper title</a></cite>',
      "</main>",
    ].join("");

    const prose = runAudit(`audit.parsePage("http://127.0.0.1/learn/x", 200, ${JSON.stringify(html)}).proseText`);

    expect(prose).toContain("By");
    expect(prose).toContain("Guide prose stays in the count.");
    expect(prose).not.toContain("Written with AI assistance");
    expect(prose).not.toContain("Bing Cheng");
    expect(prose).not.toContain("cited paper");
  });
});
