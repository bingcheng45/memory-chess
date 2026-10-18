#!/usr/bin/env node
/**
 * Loads /dashboard on a 4x slower CPU, so the record arrives from IndexedDB after the first paint, and records every
 * layout shift until the page settles, naming each node that moved with its box before and after. Fonts are left out:
 * each width loads once to warm the cache, and only the second load is measured. Runs for a new visitor and the
 * twoRounds, thirtyDays, stale and heavy players, in English and Russian, at WIDTHS, and for each tile a Learn page links
 * to, loaded directly and, at full CPU speed with the dashboard's code cached, by a click on the /learn link. A fragment
 * load is repeated because whether its shift lands depends on timing. Reports CLS as the largest session
 * window (sessionWindowCls in cls.mjs), the worst load per view, and fails when it is over MAX_CLS or when a fragment's
 * tile is not in the top half of the view.
 *
 *   npm run lab:personas && npm run lab:cls-dashboard -- --base http://localhost:4531 --out <dir> [--only <case>]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { round, sessionWindowCls } from "./cls.mjs";
import { argsOf, blockAds, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1024, 768, 390];
const VIEWS = WIDTHS.map((width) => [width, width < 600 ? 844 : 900]);
const FRAGMENT_VIEWS = [[1440, 900], [375, 812], [375, 844]];
const FRAGMENT_LOADS = 2;
const CLICK_VIEWS = [[1440, 900], [375, 812]];
const CLICK_LOADS = 6;
const LEARN_TILES = ["span", "recentAccuracy", "days"];
const PRODUCTION_WRITES = ["*/api/game-stats*", "*/api/leaderboard*", "*/api/feedback*", "*/api/contact*", "*/api/articles/*"];
const SETTLE_MS = 4000;
const CASE_ENV = "LAB_CLS_DASHBOARD_CASE";
const RESULT_FILE = "cls.json";
const CASES = [
  ...["newVisitor", "twoRounds", "thirtyDays", "stale", "heavy"].flatMap((persona) => [
    { name: `${persona}-en`, persona, path: "/dashboard", views: VIEWS, loads: 1, cpu: 4 },
    { name: `${persona}-ru`, persona, path: "/ru/dashboard", views: VIEWS, loads: 1, cpu: 4 },
  ]),
  ...["newVisitor", "heavy"].flatMap((persona) =>
    LEARN_TILES.map((tile) => ({ name: `${persona}-tile-${tile}`, persona, path: `/dashboard#tile-${tile}`, views: FRAGMENT_VIEWS, loads: FRAGMENT_LOADS, cpu: 4 })),
  ),
  ...LEARN_TILES.map((tile) => ({ name: `newVisitor-learn-${tile}`, persona: "newVisitor", path: `/dashboard#tile-${tile}`, from: "/learn", views: CLICK_VIEWS, loads: CLICK_LOADS, cpu: 1 })),
];

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
  const { path, from, views, loads, cpu } = JSON.parse(process.env[CASE_ENV]);
  const fragment = path.split("#")[1] ?? null;
  const misplaced = [];
  await blockAds(page, PRODUCTION_WRITES);
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const result = {};
  for (const [width, height] of views) {
    const view = `${width}x${height}`;
    await sized(page, width, height);
    await page.goto("about:blank");
    await page.goto(`${baseUrl}${path}`);
    await page.eval("document.fonts.ready.then(() => true)");
    for (let load = 0; load < loads; load++) {
      await page.goto("about:blank");
      if (from) {
        const link = `document.querySelector(${JSON.stringify(`a[href="${path}"]`)})`;
        await page.goto(`${baseUrl}${from}`);
        await page.waitFor(`!!${link}`, 15_000);
        await page.sleep(500);
        await page.eval(`window.__shifts = []; ${link}.click()`);
      } else await page.goto(`${baseUrl}${path}`);
      await page.sleep(SETTLE_MS);
      const shifts = await page.eval("window.__shifts");
      const cls = round(sessionWindowCls(shifts));
      const top = fragment ? await page.eval(`Math.round(document.getElementById(${JSON.stringify(fragment)})?.getBoundingClientRect().top ?? -1)`) : null;
      if (fragment && !(top >= 0 && top <= height / 2)) misplaced.push(`${view}: ${top}`);
      if (!result[view] || cls > result[view].cls) result[view] = { cls, top, shifts: shifts.map((shift) => ({ ...shift, value: round(shift.value) })) };
    }
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const over = Object.keys(result).filter((view) => result[view].cls > MAX_CLS);
  if (over.length > 0) throw new Error(`CLS over ${MAX_CLS} at ${over.map((view) => `${view}: ${result[view].cls}`).join(", ")}`);
  if (misplaced.length > 0) throw new Error(`#${fragment} not in the top half of the view at ${misplaced.join(", ")}`);
  return Object.fromEntries(Object.entries(result).map(([view, { cls }]) => [view, cls]));
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
