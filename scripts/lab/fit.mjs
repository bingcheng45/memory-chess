#!/usr/bin/env node
/**
 * Checks layouts Jest cannot measure, in a real browser: the main nav fits one
 * row on English phones with full-size tap targets, and other locales wrap to no
 * more rows than they did before that fit. Screenshots of each go to the evidence directory.
 *
 *   npm run lab:fit -- --base http://localhost:4671 --out <dir>
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, runPersona, sized } from "./drive.mjs";

const NAV_WIDTHS = [320, 360, 390];
/** Rows the nav may take per locale at 320, 360 and 390 px. English must fit one; the others may not grow. */
const NAV_ROWS = { "": [1, 1, 1], "/de": [2, 2, 2], "/ja": [2, 1, 1] };
const MIN_TAP_PX = 44;
const MIN_TEXT_PX = 14;

const NAV = `(() => {
  const links = [...document.querySelectorAll('nav[aria-label="Main"] li')].filter((item) => item.checkVisibility()).map((item) => item.querySelector("a"));
  const boxes = links.map((link) => link.getBoundingClientRect());
  return {
    rows: new Set(boxes.map((box) => Math.round(box.top))).size,
    minHeight: Math.min(...boxes.map((box) => box.height)),
    minText: Math.min(...links.map((link) => parseFloat(getComputedStyle(link).fontSize))),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`;

async function shootTop(page, file) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: await page.eval("innerWidth"), height: 220, scale: 2 } });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(file, Buffer.from(data, "base64"));
}

export default async function fit(page, { baseUrl, evidenceDir }) {
  const nav = {};
  const failures = [];
  for (const [prefix, allowed] of Object.entries(NAV_ROWS)) {
    const locale = prefix.slice(1) || "en";
    nav[locale] = {};
    for (const [index, width] of NAV_WIDTHS.entries()) {
      await sized(page, width, 800);
      await page.goto(`${baseUrl}${prefix}/leaderboard`);
      await page.waitFor(`!!document.querySelector('nav[aria-label="Main"] a')`, 20_000);
      await page.eval("document.fonts.ready.then(() => true)");
      const measured = await page.eval(NAV);
      nav[locale][width] = measured;
      await shootTop(page, join(evidenceDir, `nav-${locale}-${width}.png`));
      if (measured.rows > allowed[index]) failures.push(`${locale} at ${width}: ${measured.rows} rows, allowed ${allowed[index]}`);
      if (measured.minHeight < MIN_TAP_PX) failures.push(`${locale} at ${width}: a link ${measured.minHeight}px tall`);
      if (measured.minText < MIN_TEXT_PX) failures.push(`${locale} at ${width}: ${measured.minText}px text`);
      if (measured.overflow > 0) failures.push(`${locale} at ${width}: ${measured.overflow}px horizontal overflow`);
    }
  }
  if (failures.length > 0) throw new Error(`${failures.join("; ")}\n${JSON.stringify(nav)}`);
  return { nav };
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-fit", "http://localhost:4671");
  const run = await runPersona("fit", join(args.personas, "twoRounds.json"), args, import.meta.url);
  console.log(`${run.ok ? "PASS" : "FAIL"} fit: ${run.log}`);
  process.exit(run.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
