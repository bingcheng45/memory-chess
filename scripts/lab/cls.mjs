#!/usr/bin/env node
/**
 * Loads the home page cold, on a 4x slower CPU, at eight widths, and records every
 * layout shift on the whole page until it settles, naming the nodes that moved.
 * The Geist Mono files are held for HOLD_MS on every load, so the page always
 * paints in the fallback face first and then swaps; a load where the font was not
 * held, or never loaded after release, fails. Reports CLS as the largest session
 * window (shifts under 1 s apart, at most 5 s long), the way browsers score it,
 * and the plain sum of every shift as shiftSum. Runs for a new visitor and a 30-day
 * player (whose record loads from storage after first paint), each at the top of /
 * and scrolled to #record, and for /de, which renders the legacy body: its mono text
 * uses the platform monospace stack, so there Geist Mono must never be requested.
 * Fails when either number is over MAX_CLS.
 *
 *   npm run lab:personas && npm run lab:cls -- --base http://localhost:3128 --out <dir> [--only <case>]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1024, 1000, 768, 640, 390, 360, 320];
const CASE_ENV = "LAB_CLS_CASE";
const RESULT_FILE = "cls.json";
const HOLD_MS = 1500;
const SETTLE_MS = 4500;
const SESSION_GAP_MS = 1000;
const SESSION_MAX_MS = 5000;
const CASES = [
  { name: "newVisitor", persona: "newVisitor", path: "/" },
  { name: "newVisitor-record", persona: "newVisitor", path: "/#record" },
  { name: "thirtyDays", persona: "thirtyDays", path: "/" },
  { name: "thirtyDays-record", persona: "thirtyDays", path: "/#record" },
  { name: "de", persona: "newVisitor", path: "/de", usesMono: false },
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

const MONO_FAMILY = /Geist[_ ]Mono/;
const MONO_URLS = `[...document.styleSheets]
  .flatMap((sheet) => [...sheet.cssRules])
  .filter((rule) => rule instanceof CSSFontFaceRule && ${MONO_FAMILY}.test(rule.style.getPropertyValue("font-family")))
  .flatMap((rule) => [...rule.style.getPropertyValue("src").matchAll(/url\\("?([^")]+)"?\\)/g)].map(([, url]) => new URL(url, location.href).href))`;
export const MONO_STATUS = `[...document.fonts].filter((face) => ${MONO_FAMILY}.test(face.family) && !/Local|Fallback/.test(face.family)).map((face) => face.status)`;

export const round = (value) => Math.round(value * 10000) / 10000;

/** The Geist Mono webfont files the page's stylesheets declare, read from a page that has loaded them. */
export async function monoFontUrls(page, baseUrl) {
  await page.goto(`${baseUrl}/`);
  const urls = [...new Set(await page.eval(MONO_URLS))];
  if (urls.length === 0) throw new Error("no Geist Mono @font-face url in the page's stylesheets");
  return urls;
}

/** Largest sum of shifts in one session window: each shift under SESSION_GAP_MS after the previous, the window under SESSION_MAX_MS long. */
export function sessionWindowCls(shifts) {
  let best = 0;
  let sum = 0;
  let start = -Infinity;
  let last = -Infinity;
  for (const { at, value } of [...shifts].sort((a, b) => a.at - b.at)) {
    if (at - last >= SESSION_GAP_MS || at - start >= SESSION_MAX_MS) {
      sum = 0;
      start = at;
    }
    sum += value;
    last = at;
    best = Math.max(best, sum);
  }
  return best;
}

export default async function measure(page, { baseUrl, evidenceDir }) {
  const { path, usesMono = true } = JSON.parse(process.env[CASE_ENV]);
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await sized(page, 1440);
  const urls = await monoFontUrls(page, baseUrl);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let held = [];
  page.on((method, params) => {
    if (method !== "Fetch.requestPaused") return;
    const hold = { url: params.request.url, statusWhileHeld: null };
    held.push(hold);
    setTimeout(async () => {
      hold.statusWhileHeld = await page.eval(MONO_STATUS).catch(() => null);
      await page.send("Fetch.continueRequest", { requestId: params.requestId });
    }, HOLD_MS);
  });
  await page.send("Fetch.enable", { patterns: urls.map((urlPattern) => ({ urlPattern, requestStage: "Request" })) });

  const result = {};
  for (const width of WIDTHS) {
    await sized(page, width, width < 600 ? 844 : 900);
    await page.goto("about:blank");
    held = [];
    await page.goto(`${baseUrl}${path}`);
    await page.sleep(SETTLE_MS);
    const shifts = await page.eval("window.__shifts");
    const statusAfter = await page.eval(MONO_STATUS);
    if (!usesMono && held.length > 0) throw new Error(`at ${width}: ${path} requested Geist Mono, which it is listed as not using`);
    if (usesMono) {
      if (held.length === 0) throw new Error(`at ${width}: no Geist Mono request was held, so the fallback face may never have painted`);
      if (held.some(({ statusWhileHeld }) => statusWhileHeld?.includes("loaded"))) throw new Error(`at ${width}: Geist Mono was already loaded while its file was held`);
      if (!statusAfter.includes("loaded")) throw new Error(`at ${width}: Geist Mono did not load after release, status ${JSON.stringify(statusAfter)}`);
    }
    result[width] = {
      cls: round(sessionWindowCls(shifts)),
      shiftSum: round(shifts.reduce((sum, shift) => sum + shift.value, 0)),
      held: held.map(({ url, statusWhileHeld }) => ({ file: url.split("/").at(-1), statusWhileHeld })),
      statusAfter,
      shifts: shifts.map((shift) => ({ ...shift, value: round(shift.value) })),
    };
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const over = WIDTHS.filter((width) => result[width].cls > MAX_CLS || result[width].shiftSum > MAX_CLS);
  if (over.length > 0) throw new Error(`CLS or shiftSum over ${MAX_CLS} at ${over.map((width) => `${width}: ${result[width].cls} / ${result[width].shiftSum}`).join(", ")}`);
  return Object.fromEntries(WIDTHS.map((width) => [width, { cls: result[width].cls, shiftSum: result[width].shiftSum }]));
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-cls", "http://localhost:3128");
  const cases = CASES.filter(({ name }) => !args.only || name === args.only);
  const table = {};
  let ok = true;
  for (const { name, persona, path, usesMono } of cases) {
    process.env[CASE_ENV] = JSON.stringify({ path, usesMono });
    const run = await runPersona(name, join(args.personas, `${persona}.json`), args, import.meta.url);
    ok &&= run.ok;
    const file = join(args.out, name, RESULT_FILE);
    table[name] = existsSync(file) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(file, "utf8"))).map(([width, { cls, shiftSum }]) => [width, { cls, shiftSum }])) : null;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${name} ${path}: ${table[name] ? JSON.stringify(table[name]) : run.log}`);
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
