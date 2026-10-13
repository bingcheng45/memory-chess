#!/usr/bin/env node
/**
 * Loads /dashboard on a 4x slower CPU, so the record arrives from IndexedDB after the first paint, and records every
 * layout shift until the page settles, naming each node that moved with its box before and after. Fonts are left out:
 * each width loads once to warm the cache, and only the second load is measured. Runs for a new visitor and the
 * twoRounds, thirtyDays, stale and heavy players, in English and Russian, at WIDTHS. Reports CLS as the largest session window
 * (sessionWindowCls in cls.mjs) and fails when it is over MAX_CLS.
 *
 *   npm run lab:personas && npm run lab:cls-dashboard -- --base http://localhost:4531 --out <dir> [--only <case>]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { round, sessionWindowCls } from "./cls.mjs";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1024, 768, 390];
const SETTLE_MS = 4000;
const CASE_ENV = "LAB_CLS_DASHBOARD_CASE";
const RESULT_FILE = "cls.json";
const CASES = ["newVisitor", "twoRounds", "thirtyDays", "stale", "heavy"].flatMap((persona) => [
  { name: `${persona}-en`, persona, path: "/dashboard" },
  { name: `${persona}-ru`, persona, path: "/ru/dashboard" },
]);

const OBSERVE = `window.__shifts = [];
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue;
    const name = (node) => {
      const element = node && (node.nodeType === 1 ? node : node.parentElement);
      if (!element) return "?";
      return element.tagName.toLowerCase() + "." + String(element.className?.baseVal ?? element.className).split(" ")[0] + (element.id ? "#" + element.id : "");
    };
    const box = ({ y, height }) => [Math.round(y), Math.round(height)];
    window.__shifts.push({
      at: Math.round(entry.startTime),
      value: entry.value,
      nodes: entry.sources.map((source) => ({ node: name(source.node), from: box(source.previousRect), to: box(source.currentRect) })),
    });
  }
}).observe({ type: "layout-shift", buffered: true });`;

export default async function measure(page, { baseUrl, evidenceDir }) {
  const { path } = JSON.parse(process.env[CASE_ENV]);
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const result = {};
  for (const width of WIDTHS) {
    await sized(page, width, width < 600 ? 844 : 900);
    await page.goto(`${baseUrl}${path}`);
    await page.eval("document.fonts.ready.then(() => true)");
    await page.goto("about:blank");
    await page.goto(`${baseUrl}${path}`);
    await page.sleep(SETTLE_MS);
    const shifts = await page.eval("window.__shifts");
    result[width] = {
      cls: round(sessionWindowCls(shifts)),
      shifts: shifts.map((shift) => ({ ...shift, value: round(shift.value) })),
    };
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const over = WIDTHS.filter((width) => result[width].cls > MAX_CLS);
  if (over.length > 0) throw new Error(`CLS over ${MAX_CLS} at ${over.map((width) => `${width}: ${result[width].cls}`).join(", ")}`);
  return Object.fromEntries(WIDTHS.map((width) => [width, result[width].cls]));
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-cls-dashboard", "http://localhost:4531");
  const table = {};
  let ok = true;
  for (const { name, persona, ...testCase } of CASES.filter(({ name }) => !args.only || name === args.only)) {
    process.env[CASE_ENV] = JSON.stringify(testCase);
    const run = await runPersona(name, join(args.personas, `${persona}.json`), args, import.meta.url);
    ok &&= run.ok;
    const file = join(args.out, name, RESULT_FILE);
    table[name] = existsSync(file) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(file, "utf8"))).map(([width, { cls }]) => [width, cls])) : null;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${name} ${testCase.path}: ${table[name] ? JSON.stringify(table[name]) : run.log}`);
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
