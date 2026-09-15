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
