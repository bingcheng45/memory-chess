#!/usr/bin/env node
/**
 * Loads the home page cold, on a 4x slower CPU, at ten widths, and records every
 * layout shift on the whole page until it settles, naming the nodes that moved.
 * Every webfont file the stylesheets declare is held for HOLD_MS on every load at the top of a page, and the Geist Mono files on a
 * load scrolled into the page, so the page always paints in the fallback faces first
 * and then swaps; a load where no file was held, where a webfont had loaded while the
 * first file was held, or where Geist Mono never loaded after release, fails. Reports CLS as the largest session
 * window (shifts under 1 s apart, at most 5 s long), the way browsers score it,
 * and the plain sum of every shift as shiftSum. Runs for a new visitor and a 30-day
 * player (whose record loads from storage after first paint), each at the top of /
 * and scrolled to #record, for a two-round player whose panels are still warming scrolled to #record,
 * for a player mid-plan with a goal reached scrolled to #record,
 * for a player who has played today's board scrolled to #record,
 * for a returning player due the record note, scrolled to #record, where the note must appear, and with the tools
 * row centred before the record loads, as a reload that restores the scroll position leaves it, where the note
 * must wait for a later visit,
 * for the German, Japanese and Russian homes, new and 30-day, where translated copy fills the same reserved boxes,
 * and for a new visitor's home, /game and /leaderboard in the long-string locales, where a translated line that
 * wraps differently in the fallback face moves everything under it when the webfont arrives.
 * Fails when either number is over MAX_CLS, except at the widths KNOWN_REWRAPS lists,
 * which it reports.
 *
 *   npm run lab:personas && npm run lab:cls -- --base http://localhost:3128 --out <dir> [--only <case>]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1280, 1024, 1000, 768, 640, 390, 375, 360, 320];
const LOCALE_WIDTHS = [1280, 1024, 768, 390, 375, 320];
const CASE_ENV = "LAB_CLS_CASE";
const RESULT_FILE = "cls.json";
const HOLD_MS = 1500;
// The hero's Open Sans paragraphs (hu, pl, ko) and Devanagari heading (hi) still break lines differently in the fallback face.
const KNOWN_REWRAPS = { hu: [320], pl: [768], ko: [320], hi: [390, 768, 1024, 1280] };
const SETTLE_MS = 4500;
const SESSION_GAP_MS = 1000;
const SESSION_MAX_MS = 5000;
// The note shows on the visit that first brings it into view, so each load forgets that it was seen.
const NOTE = { forget: ["memory-chess-lab-install-nudge"] };
const NOTE_BOX = "#record .lab-nudge";
const CASES = [
  { name: "newVisitor", persona: "newVisitor", path: "/" },
  { name: "newVisitor-record", persona: "newVisitor", path: "/#record" },
  { name: "thirtyDays", persona: "thirtyDays", path: "/" },
  { name: "thirtyDays-record", persona: "thirtyDays", path: "/#record" },
  { name: "twoRounds-record", persona: "twoRounds", path: "/#record" },
  { name: "planEdge-record", persona: "planEdge", path: "/#record" },
  { name: "dailyPlayed-record", persona: "dailyPlayed", path: "/#record" },
  { name: "note-record", persona: "threeDays", path: "/#record", shows: NOTE_BOX, ...NOTE },
  { name: "note-tools", persona: "threeDays", path: "/", centre: "#record .lab-tools-slot", hides: NOTE_BOX, ...NOTE },
  { name: "de", persona: "newVisitor", path: "/de" },
  { name: "de-record", persona: "thirtyDays", path: "/de#record" },
  { name: "ja", persona: "newVisitor", path: "/ja" },
  { name: "ja-record", persona: "thirtyDays", path: "/ja#record" },
  { name: "ru", persona: "newVisitor", path: "/ru" },
  { name: "ru-record", persona: "thirtyDays", path: "/ru#record" },
  ...["de", "fi", "ru", "pt-BR", "pl", "hu", "ja", "zh-CN", "ko", "hi"].flatMap((locale) => [
    ...(["de", "ja", "ru"].includes(locale) ? [] : [{ name: locale, persona: "newVisitor", path: `/${locale}`, widths: LOCALE_WIDTHS }]),
    { name: `${locale}-game`, persona: "newVisitor", path: `/${locale}/game`, widths: LOCALE_WIDTHS },
    { name: `${locale}-leaderboard`, persona: "newVisitor", path: `/${locale}/leaderboard`, widths: LOCALE_WIDTHS },
  ]),
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
const WEB_URLS = `[...document.styleSheets]
  .flatMap((sheet) => [...sheet.cssRules])
  .filter((rule) => rule instanceof CSSFontFaceRule)
  .flatMap((rule) => [...rule.style.getPropertyValue("src").matchAll(/url\\("?([^")]+)"?\\)/g)].map(([, url]) => new URL(url, location.href).href))`;
const WEB_LOADED = `(() => {
  const webFamilies = new Set([...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .filter((rule) => rule instanceof CSSFontFaceRule && rule.style.getPropertyValue("src").includes("url("))
    .map((rule) => rule.style.getPropertyValue("font-family").replace(/['"]/g, "")));
  return [...document.fonts].filter((face) => face.status === "loaded" && webFamilies.has(face.family.replace(/['"]/g, ""))).map((face) => face.family);
})()`;

export const round = (value) => Math.round(value * 10000) / 10000;

async function webFontUrls(page, baseUrl) {
  await page.goto(`${baseUrl}/`);
  const urls = [...new Set(await page.eval(WEB_URLS))];
  if (urls.length === 0) throw new Error("no webfont @font-face url in the page's stylesheets");
  return urls;
}

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

/** Runs before any page script on every load: forgets the listed keys, and centres an element once the document has parsed. */
const beforeLoad = ({ forget = [], centre = null }) => `
${JSON.stringify(forget)}.forEach((key) => localStorage.removeItem(key));
${centre ? `document.addEventListener("DOMContentLoaded", () => document.querySelector(${JSON.stringify(centre)}).scrollIntoView({ block: "center" }));` : ""}`;

export default async function measure(page, { baseUrl, evidenceDir }) {
  const testCase = JSON.parse(process.env[CASE_ENV]);
  const { name, path, shows = null, hides = null, centre = null, widths = WIDTHS } = testCase;
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await sized(page, 1440);
  const holdsMonoOnly = path.includes("#") || centre !== null;
  const urls = holdsMonoOnly ? await monoFontUrls(page, baseUrl) : await webFontUrls(page, baseUrl);
  const loadedWebfonts = holdsMonoOnly ? `${MONO_STATUS}.includes("loaded") ? ["Geist Mono"] : []` : WEB_LOADED;
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: beforeLoad(testCase) });
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let held = [];
  page.on((method, params) => {
    if (method !== "Fetch.requestPaused") return;
    const hold = { url: params.request.url, loadedWhileHeld: null };
    held.push(hold);
    setTimeout(async () => {
      hold.loadedWhileHeld = await page.eval(loadedWebfonts).catch(() => null);
      await page.send("Fetch.continueRequest", { requestId: params.requestId });
    }, HOLD_MS);
  });
  await page.send("Fetch.enable", { patterns: urls.map((urlPattern) => ({ urlPattern, requestStage: "Request" })) });

  const result = {};
  for (const width of widths) {
    await sized(page, width, width < 600 ? 844 : 900);
    await page.goto("about:blank");
    held = [];
    await page.goto(`${baseUrl}${path}`);
    await page.sleep(SETTLE_MS);
    const shifts = await page.eval("window.__shifts");
    const statusAfter = await page.eval(MONO_STATUS);
    if (shows && !(await page.eval(`!!document.querySelector(${JSON.stringify(shows)})`))) throw new Error(`at ${width}: ${shows} never appeared`);
    if (hides && (await page.eval(`!!document.querySelector(${JSON.stringify(hides)})`))) throw new Error(`at ${width}: ${hides} appeared`);
    if (held.length === 0) throw new Error(`at ${width}: no webfont request was held, so the fallback faces may never have painted`);
    // A page with Cyrillic text asks for a second subset file after the Latin one, so only the first hold proves the fallback painted first.
    if (held[0].loadedWhileHeld?.length) throw new Error(`at ${width}: ${held[0].loadedWhileHeld.join(", ")} had already loaded while the first file was held`);
    if (!statusAfter.includes("loaded")) throw new Error(`at ${width}: Geist Mono did not load after release, status ${JSON.stringify(statusAfter)}`);
    result[width] = {
      cls: round(sessionWindowCls(shifts)),
      shiftSum: round(shifts.reduce((sum, shift) => sum + shift.value, 0)),
      held: held.map(({ url, loadedWhileHeld }) => ({ file: url.split("/").at(-1), loadedWhileHeld })),
      statusAfter,
      shifts: shifts.map((shift) => ({ ...shift, value: round(shift.value) })),
    };
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const over = widths.filter((width) => (result[width].cls > MAX_CLS || result[width].shiftSum > MAX_CLS) && !KNOWN_REWRAPS[name]?.includes(width));
  if (over.length > 0) throw new Error(`CLS or shiftSum over ${MAX_CLS} at ${over.map((width) => `${width}: ${result[width].cls} / ${result[width].shiftSum}`).join(", ")}`);
  return Object.fromEntries(widths.map((width) => [width, { cls: result[width].cls, shiftSum: result[width].shiftSum, ...(KNOWN_REWRAPS[name]?.includes(width) && { known: true }) }]));
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-cls", "http://localhost:3128");
  const cases = CASES.filter(({ name }) => !args.only || name === args.only);
  const table = {};
  let ok = true;
  for (const { name, persona, ...testCase } of cases) {
    const { path } = testCase;
    process.env[CASE_ENV] = JSON.stringify({ name, ...testCase });
    const run = await runPersona(name, join(args.personas, `${persona}.json`), args, import.meta.url);
    ok &&= run.ok;
    const file = join(args.out, name, RESULT_FILE);
    table[name] = existsSync(file) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(file, "utf8"))).map(([width, { cls, shiftSum }]) => [width, { cls, shiftSum }])) : null;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${name} ${path}: ${table[name] ? JSON.stringify(table[name]) : run.log}`);
    for (const width of KNOWN_REWRAPS[name] ?? []) if (table[name]?.[width]) console.log(`KNOWN ISSUE ${name} ${width}: a line rewraps when the webfont arrives, cls ${table[name][width].cls}`);
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
