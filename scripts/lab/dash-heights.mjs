#!/usr/bin/env node
/**
 * Measures the dashboard's today tiles, the only ones drawn before the record is read, with their reserved height switched off, for every locale and the personas in
 * PERSONAS, at the narrowest width of each layout in WIDTHS, and fails when a row of tiles is taller than the
 * min-height its tiles reserve before the record is read. A row that outgrows its reserve pushes everything under it
 * down when the figures arrive, a layout shift. Prints the tallest row per tile list and width, with who drew it.
 *
 *   npm run lab:personas && npm run lab:dash-heights -- --base http://localhost:4531 --out <dir> [--only <locale>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, blockAds, loadPersona, PERSONA_ENV, runPersonaPool, sized } from "./drive.mjs";
import "./ts-hooks.mjs";

const { LOCALES } = await import(pathToFileURL(join(process.cwd(), "src/i18n/routing.ts")).href);
const CASE_ENV = "LAB_DASH_HEIGHTS_CASE";
const RESULT_FILE = "heights.json";
// Empty, warming, ready with trends, stale figures with their tags, and a long record.
const PERSONAS = ["newVisitor", "twoRounds", "thirtyDays", "stale", "heavy"];
// Both sides of each width dashboard.css changes the tiles' columns or reserves at; each tier's narrowest width is its tallest.
const WIDTHS = [1440, 1024, 1023, 768, 767, 480, 479, 390, 360, 359, 320];
const LISTS = ["today"];
const CONCURRENCY = 4;

const MEASURE = `(() => {
  const lists = ${JSON.stringify(LISTS)};
  const reserve = Object.fromEntries(lists.map((size) => [size, parseFloat(getComputedStyle(document.querySelector('.lab-tiles[data-size="' + size + '"] .lab-tile')).minHeight)]));
  const style = document.createElement("style");
  style.textContent = ".lab-dashboard .lab-tile { min-height: 0 !important; }";
  document.head.append(style);
  const tallest = Object.fromEntries(lists.map((size) => [size, Math.max(...[...document.querySelectorAll('.lab-tiles[data-size="' + size + '"] .lab-tile')].map((tile) => Math.ceil(tile.getBoundingClientRect().height)))]));
  style.remove();
  return { reserve, tallest };
})()`;

export default async function heights(page, { baseUrl, evidenceDir }) {
  const { locale } = JSON.parse(process.env[CASE_ENV]);
  await blockAds(page);
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await sized(page, WIDTHS[0]);
  await page.goto(`${baseUrl}${locale === "en" ? "" : `/${locale}`}/dashboard`);
  await page.waitFor(`!document.querySelector('.lab-tile[data-state="loading"]') && document.fonts.ready.then(() => true)`, 20_000);
  const result = {};
  for (const width of WIDTHS) {
    await sized(page, width);
    await page.eval("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    result[width] = await page.eval(MEASURE);
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  return { locale };
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-dash-heights", "http://localhost:4531");
  const runs = PERSONAS.flatMap((persona) => LOCALES.filter((locale) => !args.only || locale === args.only).map((locale) => ({ persona, locale })));
  const pooled = await runPersonaPool(
    runs.map(({ persona, locale }) => ({ name: `${persona}-${locale}`, persona, locale, testCase: { locale } })),
    { args, script: import.meta.url, caseEnv: CASE_ENV, concurrency: CONCURRENCY },
  );
  const outcomes = pooled.map(({ name, locale, run }) => ({ name, locale, run, measured: run.ok ? JSON.parse(readFileSync(join(args.out, name, RESULT_FILE), "utf8")) : null }));

  const failures = outcomes.filter(({ measured }) => !measured).map(({ name, run }) => `${name}: run failed: ${run.log}`);
  const table = {};
  const measured = outcomes.filter((outcome) => outcome.measured);
  for (const [set, inSet] of [["en", ({ locale }) => locale === "en"], ["translated", ({ locale }) => locale !== "en"]]) {
    for (const size of LISTS) {
      for (const width of WIDTHS) {
        const rows = measured.filter(inSet).map(({ name, measured }) => ({ name, height: measured[width].tallest[size], reserve: measured[width].reserve[size] }));
        if (rows.length === 0) continue;
        const top = rows.reduce((best, row) => (row.height > best.height ? row : best));
        const over = rows.filter((row) => row.height > row.reserve);
        table[`${set} ${size} ${width}`] = { reserve: top.reserve, tallest: top.height, by: top.name, over: over.length };
        failures.push(...over.map((row) => `${size} at ${width}: ${row.name} is ${row.height}px, reserve ${row.reserve}px`));
      }
    }
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  console.table(table);
  console.log(failures.length === 0 ? "PASS every tile row fits its reserve" : `FAIL ${failures.length}:\n  ${failures.join("\n  ")}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
