#!/usr/bin/env node
/**
 * Loads the home page cold, on a 4x slower CPU, at eight widths, and sums every
 * layout shift on the whole page until it settles, naming the nodes that moved.
 * Runs for a new visitor and a 30-day player (whose record loads from storage
 * after first paint), each at the top of / and scrolled to #record, and for /de,
 * which renders the legacy body. Fails when any load shifts more than MAX_CLS.
 *
 *   npm run lab:personas && npm run lab:cls -- --base http://localhost:3128 --out <dir> [--only <case>]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1024, 1000, 768, 640, 390, 360, 320];
const PATH_ENV = "LAB_CLS_PATH";
const RESULT_FILE = "cls.json";
const SETTLE_MS = 4500;
const CASES = [
  { name: "newVisitor", persona: "newVisitor", path: "/" },
  { name: "newVisitor-record", persona: "newVisitor", path: "/#record" },
  { name: "thirtyDays", persona: "thirtyDays", path: "/" },
  { name: "thirtyDays-record", persona: "thirtyDays", path: "/#record" },
  { name: "de", persona: "newVisitor", path: "/de" },
];

// Registered before any page script runs, so shifts during parse and hydration are not missed.
const OBSERVE = `window.__shifts = [];
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue;
    const name = (node) => {
      const element = node && (node.nodeType === 1 ? node : node.parentElement);
      if (!element) return "?";
      const section = element.closest("section[id], header, footer, nav");
      return element.tagName.toLowerCase() + "." + String(element.className?.baseVal ?? element.className).split(" ")[0] + (section ? " in " + (section.id || section.tagName.toLowerCase()) : "");
    };
    window.__shifts.push({ at: Math.round(entry.startTime), value: entry.value, nodes: entry.sources.map((source) => name(source.node)) });
  }
}).observe({ type: "layout-shift", buffered: true });`;

const round = (value) => Math.round(value * 10000) / 10000;

export default async function measure(page, { baseUrl, evidenceDir }) {
  const path = process.env[PATH_ENV];
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const result = {};
  for (const width of WIDTHS) {
    await sized(page, width, width < 600 ? 844 : 900);
    await page.goto("about:blank");
    await page.goto(`${baseUrl}${path}`);
    await page.sleep(SETTLE_MS);
    const shifts = await page.eval("window.__shifts");
    result[width] = { cls: round(shifts.reduce((sum, shift) => sum + shift.value, 0)), shifts: shifts.map((shift) => ({ ...shift, value: round(shift.value) })) };
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const over = WIDTHS.filter((width) => result[width].cls > MAX_CLS);
  if (over.length > 0) throw new Error(`CLS over ${MAX_CLS} at ${over.map((width) => `${width}: ${result[width].cls}`).join(", ")}`);
  return Object.fromEntries(WIDTHS.map((width) => [width, result[width].cls]));
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-cls");
  const cases = CASES.filter(({ name }) => !args.only || name === args.only);
  const table = {};
  let ok = true;
  for (const { name, persona, path } of cases) {
    process.env[PATH_ENV] = path;
    const run = await runPersona(name, join(args.personas, `${persona}.json`), args, import.meta.url);
    ok &&= run.ok;
    const file = join(args.out, name, RESULT_FILE);
    table[name] = existsSync(file) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(file, "utf8"))).map(([width, { cls }]) => [width, cls])) : null;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${name} ${path}: ${table[name] ? JSON.stringify(table[name]) : run.log}`);
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
