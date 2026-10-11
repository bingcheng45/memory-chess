#!/usr/bin/env node
/**
 * Checks layouts Jest cannot measure, in a real browser, each case in a fresh profile:
 * the main nav fits one row on English phones with full-size tap targets, and other
 * locales wrap to no more rows than they did before that fit; the dashboard's play
 * button, shown while no headline figure is ready, is as wide as its label; and the
 * share card sets its rounds line in the card's sans, as it sets every other lowercase line.
 * Screenshots of each go to the evidence directory.
 *
 *   npm run lab:personas && npm run lab:fit -- --base http://localhost:4671 --out <dir> [--only <case>]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const CASE_ENV = "LAB_FIT_CASE";
const NAV_WIDTHS = [320, 360, 390];
/** Rows the nav may take per locale at 320, 360 and 390 px. English must fit one; the others may not grow. */
const NAV_ROWS = { "": [1, 1, 1], "/de": [2, 2, 1], "/ja": [1, 1, 1] };
const MIN_TAP_PX = 44;
const MIN_TEXT_PX = 14;
const LOCKED_WIDTHS = [1440, 390];

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

/** The play button's width beside the width its label and padding need on their own. */
const LOCKED = `(() => {
  const button = document.querySelector(".lab-share > a.lab-btn");
  const natural = button.cloneNode(true);
  natural.style.cssText = "position: absolute; width: max-content;";
  button.parentElement.append(natural);
  const result = { width: Math.round(button.getBoundingClientRect().width), natural: Math.round(natural.getBoundingClientRect().width) };
  natural.remove();
  return result;
})()`;

async function shoot(page, file, clip) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png", clip: { scale: 2, ...clip }, captureBeyondViewport: true });
  writeFileSync(file, Buffer.from(data, "base64"));
}

async function nav(page, { baseUrl, evidenceDir }) {
  const measured = {};
  const failures = [];
  for (const [prefix, allowed] of Object.entries(NAV_ROWS)) {
    const locale = prefix.slice(1) || "en";
    measured[locale] = {};
    for (const [index, width] of NAV_WIDTHS.entries()) {
      await sized(page, width, 800);
      await page.goto(`${baseUrl}${prefix}/leaderboard`);
      await page.waitFor(`!!document.querySelector('nav[aria-label="Main"] a')`, 20_000);
      await page.eval("document.fonts.ready.then(() => true)");
      const row = await page.eval(NAV);
      measured[locale][width] = row;
      await shoot(page, join(evidenceDir, `nav-${locale}-${width}.png`), { x: 0, y: 0, width, height: 220 });
      if (row.rows > allowed[index]) failures.push(`${locale} at ${width}: ${row.rows} rows, allowed ${allowed[index]}`);
      if (row.minHeight < MIN_TAP_PX) failures.push(`${locale} at ${width}: a link ${row.minHeight}px tall`);
      if (row.minText < MIN_TEXT_PX) failures.push(`${locale} at ${width}: ${row.minText}px text`);
      if (row.overflow > 0) failures.push(`${locale} at ${width}: ${row.overflow}px horizontal overflow`);
    }
  }
  return { measured, failures };
}

async function locked(page, { baseUrl, evidenceDir }) {
  const measured = {};
  const failures = [];
  for (const width of LOCKED_WIDTHS) {
    await sized(page, width);
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitFor(`!!document.querySelector(".lab-share > a.lab-btn")`, 20_000);
    const box = await page.eval(LOCKED);
    measured[width] = box;
    await shoot(page, join(evidenceDir, `locked-${width}.png`), await page.eval(`(() => { const r = document.querySelector(".lab-dash-head").getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; })()`));
    if (box.width !== box.natural) failures.push(`at ${width}: play button ${box.width}px wide, its label needs ${box.natural}px`);
  }
  return { measured, failures };
}

/** Keeps every blob the page saves and the font of every line the canvas draws, so the card is read as the player gets it. */
const RECORD_CARD = `(() => {
  window.__blobs = [];
  window.__lines = [];
  const objectUrl = URL.createObjectURL;
  URL.createObjectURL = (blob) => { window.__blobs.push(blob); return objectUrl.call(URL, blob); };
  const fillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y) { window.__lines.push([text, this.font]); return fillText.call(this, text, x, y); };
})()`;
const BLOB_BASE64 = `window.__blobs[0].arrayBuffer().then((buffer) => {
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
})`;
const ROUNDS_FONT = '500 30px Geist, "Geist Fallback", system-ui, -apple-system, "Segoe UI", sans-serif';

async function card(page, { baseUrl, evidenceDir }) {
  await sized(page, 1440);
  await page.goto(`${baseUrl}/dashboard`);
  await page.waitFor(`!!document.querySelector(".lab-share button")`, 20_000);
  await page.eval(RECORD_CARD);
  await page.click(".lab-share button", "Share my progress");
  await page.waitFor("window.__blobs.length > 0 || null", 20_000);
  writeFileSync(join(evidenceDir, "card.png"), Buffer.from(await page.eval(BLOB_BASE64), "base64"));
  const rounds = (await page.eval("window.__lines")).find(([text]) => /rounds played$/.test(text));
  return { measured: { rounds }, failures: rounds?.[1] === ROUNDS_FONT ? [] : [`rounds line drawn in ${rounds?.[1]}, expected ${ROUNDS_FONT}`] };
}

const CHECKS = { nav, locked, card };
const CASES = [
  { name: "nav", persona: "newVisitor" },
  { name: "locked", persona: "twoRounds" },
  { name: "card", persona: "threeDays" },
];

export default async function fit(page, context) {
  const { name } = JSON.parse(process.env[CASE_ENV]);
  await loadPersona(page, context.baseUrl, process.env[PERSONA_ENV]);
  const { measured, failures } = await CHECKS[name](page, context);
  if (failures.length > 0) throw new Error(`${failures.join("; ")}\n${JSON.stringify(measured)}`);
  return measured;
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-fit", "http://localhost:4671");
  let ok = true;
  for (const testCase of CASES.filter(({ name }) => !args.only || name === args.only)) {
    process.env[CASE_ENV] = JSON.stringify(testCase);
    const run = await runPersona(testCase.name, join(args.personas, `${testCase.persona}.json`), args, import.meta.url);
    ok &&= run.ok;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${testCase.name}: ${run.log}`);
  }
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
