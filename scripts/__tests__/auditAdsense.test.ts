/** @jest-environment node */

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const AUDIT_URL = pathToFileURL(join(__dirname, "..", "audit-adsense.mjs")).href;

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
