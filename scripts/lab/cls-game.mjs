#!/usr/bin/env node
/**
 * Plays real /game rounds cold, on a 4x slower CPU, at eight widths, and records
 * every layout shift with the nodes that moved and their rects before and after.
 * Each shift is tagged in the page with the screen showing when it happened:
 * config, memorize, solve or result. Two loads per width: /game, where the quick
 * start button opens a round, and the home page's round link, which memorizes
 * until the clock runs out (no Skip, so the switch to solving is not an input),
 * places 4 of 6 pieces and submits. The leaderboard cutoffs answer "open" for
 * every board, so the round qualifies and the result screen shows its banner.
 * They answer when asked, as they do in the field, where the round warms them;
 * with --late-cutoffs they arrive LATE_CUTOFFS_MS after the result screen does,
 * as on a network slower than the whole round. Plays counter and leaderboard
 * writes are answered locally. Shifts after the quick start click count as
 * "start". Fails when any screen's CLS, the largest session window of shifts
 * without recent input (sessionWindowCls in cls.mjs), is over MAX_CLS.
 *
 *   npm run lab:cls-game -- --base http://localhost:3131 --out <dir> [--only en|de] [--late-cutoffs]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { round, sessionWindowCls } from "./cls.mjs";
import { argsOf, runPersona, sized } from "./drive.mjs";

const MAX_CLS = 0.02;
const WIDTHS = [1440, 1024, 1000, 768, 640, 390, 360, 320];
const CASE_ENV = "LAB_CLS_GAME_CASE";
const RESULT_FILE = "cls-game.json";
const SETTLE_MS = 4500;
const START_SETTLE_MS = 3000;
const LATE_CUTOFFS_MS = 1000;
const CORRECT_PIECES = 4;
const ROUND_PATH = "/game?pieceCount=6&memorizeTime=10&source=home_quick";
const CASES = [
  { name: "en", prefix: "" },
  { name: "de", prefix: "/de" },
];
const SCREENS = ["config", "start", "memorize", "solve", "result"];
const OPEN_CUTOFFS = { easy: { kind: "open" }, medium: { kind: "open" }, hard: { kind: "open" }, grandmaster: { kind: "open" } };

// Registered before any page script runs. The screen is read when the entry is delivered, right after the frame that shifted.
const OBSERVE = `window.__shifts = [];
new PerformanceObserver((list) => {
  const screen = document.getElementById("game-result-heading") ? "result"
    : document.querySelector("[data-game-config]") ? "config"
    : document.querySelector('[role="button"][data-coordinate]') ? "solve" : "memorize";
  const name = (node) => {
    const element = node && (node.nodeType === 1 ? node : node.parentElement);
    if (!element) return "?";
    const label = element.closest("[aria-labelledby], [aria-label], [data-result-board], [data-game-config]");
    return element.tagName.toLowerCase() + "." + String(element.className?.baseVal ?? element.className).split(" ").slice(0, 3).join(".") +
      (label ? " in " + (label.getAttribute("aria-labelledby") || label.getAttribute("data-result-board") || label.getAttribute("aria-label") || "config") : "");
  };
  const rect = ({ x, y, width, height }) => [x, y, width, height].map(Math.round);
  for (const entry of list.getEntries()) {
    window.__shifts.push({
      at: Math.round(entry.startTime),
      value: entry.value,
      input: entry.hadRecentInput,
      screen,
      sources: entry.sources.map((source) => ({ node: name(source.node), before: rect(source.previousRect), after: rect(source.currentRect) })),
    });
  }
}).observe({ type: "layout-shift", buffered: true });`;

function labels(locale) {
  const { game } = JSON.parse(readFileSync(join("messages", `${locale}.json`), "utf8"));
  // Longest first, so "weiße Dame" is never read as a shorter name it ends with.
  const pieceNames = Object.entries(game.board.pieces)
    .flatMap(([color, types]) => Object.entries(types).map(([type, name]) => ({ color, type, name })))
    .sort((a, b) => b.name.length - a.name.length);
  return {
    submit: game.hud.submit,
    color: { white: game.place.selectWhite, black: game.place.selectBlack },
    piece: (name) => game.board.selectPiece.replace("{piece}", name),
    pieceIn: (label) => pieceNames.find(({ name }) => label.endsWith(name)),
  };
}

async function clickSelector(page, selector) {
  await page.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`, 10_000);
  await page.click(selector);
}

/** Answers the cutoffs with every board open, after `release` resolves; answers counter and leaderboard writes locally. */
async function stubNetwork(page, release) {
  page.on((method, params) => {
    if (method !== "Fetch.requestPaused") return;
    const respond = (data) =>
      page.send("Fetch.fulfillRequest", {
        requestId: params.requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(JSON.stringify(data)).toString("base64"),
      });
    if (params.request.url.includes("/api/leaderboard/cutoffs")) release().then(() => respond({ data: OPEN_CUTOFFS }));
    else if (params.request.method === "POST") respond({ success: true, data: { value: 1 } });
    else page.send("Fetch.continueRequest", { requestId: params.requestId });
  });
  await page.send("Fetch.enable", {
    patterns: ["*/api/leaderboard/cutoffs*", "*/api/game-stats*", "*/api/leaderboard"].map((urlPattern) => ({ urlPattern, requestStage: "Request" })),
  });
}

async function playRound(page, base, prefix, text) {
  await page.goto(`${base}${prefix}${ROUND_PATH}`);
  await page.waitFor(`document.querySelectorAll("[data-coordinate]").length === 64`, 20_000);
  const pieces = await page.eval(`[...document.querySelectorAll("[data-coordinate]")].map((el) => ({ square: el.dataset.coordinate, label: el.getAttribute("aria-label") || "" })).filter((p) => p.label !== p.square)`);
  await page.waitFor(`!!document.querySelector('[role="button"][data-coordinate]')`, 30_000);
  for (const { square, label } of pieces.slice(0, CORRECT_PIECES)) {
    const piece = text.pieceIn(label);
    if (!piece) throw new Error(`no piece name ends the label "${label}"`);
    await clickSelector(page, `[aria-label="${text.color[piece.color]}"]`);
    await clickSelector(page, `[aria-label="${text.piece(piece.name)}"]`);
    await clickSelector(page, `[role="button"][data-coordinate="${square}"]`);
  }
  await page.clickText("button", text.submit);
  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  return pieces.length;
}

function screensOf(shifts) {
  return Object.fromEntries(
    SCREENS.map((screen) => {
      const own = shifts.filter((shift) => shift.screen === screen);
      const counted = own.filter((shift) => !shift.input);
      return [screen, { cls: round(sessionWindowCls(counted)), inputShiftSum: round(own.filter((shift) => shift.input).reduce((sum, shift) => sum + shift.value, 0)), shifts: own.map((shift) => ({ ...shift, value: round(shift.value) })) }];
    }),
  );
}

const clsByScreen = ({ screens }) => Object.fromEntries(SCREENS.map((screen) => [screen, screens[screen].cls]));

async function measureWidth(page, base, { prefix, lateCutoffs }, text, width, cutoffs) {
  await sized(page, width, width < 600 ? 844 : 900);
  cutoffs.release = () => Promise.resolve();

  await page.goto(`${base}${prefix}/game`);
  await page.waitFor(`!!document.querySelector("[data-quick-start]")`, 20_000);
  await page.sleep(SETTLE_MS);
  await page.click("[data-quick-start]");
  await page.sleep(START_SETTLE_MS);
  const start = (await page.eval("window.__shifts")).map((shift) => ({ ...shift, screen: shift.screen === "config" ? "config" : "start" }));
  await page.eval(`localStorage.removeItem("memory-chess:leaderboard-cutoffs:v1")`);

  await page.goto("about:blank");
  let resultShown;
  const shown = new Promise((resolve) => (resultShown = resolve));
  if (lateCutoffs) cutoffs.release = () => shown.then(() => page.sleep(LATE_CUTOFFS_MS));
  const pieces = await playRound(page, base, prefix, text);
  resultShown();
  await page.sleep(SETTLE_MS);
  const roundShifts = await page.eval("window.__shifts");
  const banner = await page.eval(`!!document.querySelector('#game-result-heading ~ p[role="status"]')`);
  const labCard = await page.eval(`!!document.querySelector('section[aria-labelledby="result-lab-title"]')`);
  const overflow = (await page.eval("document.documentElement.scrollWidth")) - width;

  return { width, pieces, banner, labCard, overflow, screens: screensOf([...start, ...roundShifts]) };
}

/** One case at one width, in the fresh profile the harness launches for each run, so every load is a first visit. */
export default async function measure(page, { baseUrl, evidenceDir }) {
  const { testCase, width } = JSON.parse(process.env[CASE_ENV]);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
  await page.send("Network.enable");
  await page.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const cutoffs = {};
  await stubNetwork(page, () => cutoffs.release());

  const result = await measureWidth(page, baseUrl, testCase, labels(testCase.prefix.slice(1) || "en"), width, cutoffs);
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  if (!result.banner) throw new Error("the qualifying banner never showed, so its arrival was not measured");
  const over = SCREENS.filter((screen) => result.screens[screen].cls > MAX_CLS);
  if (over.length > 0) throw new Error(`CLS over ${MAX_CLS} on ${over.map((screen) => `${screen}: ${result.screens[screen].cls}`).join(", ")}`);
  return clsByScreen(result);
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-drive/cls-game", "http://localhost:3131");
  const table = {};
  let ok = true;
  const lateCutoffs = process.argv.includes("--late-cutoffs");
  for (const testCase of CASES.filter(({ name }) => !args.only || name === args.only).map((testCase) => ({ ...testCase, lateCutoffs }))) {
    table[testCase.name] = {};
    for (const width of WIDTHS) {
      process.env[CASE_ENV] = JSON.stringify({ testCase, width });
      const run = await runPersona(join(testCase.name, String(width)), "", args, import.meta.url);
      ok &&= run.ok;
      const file = join(args.out, testCase.name, String(width), RESULT_FILE);
      table[testCase.name][width] = existsSync(file) ? clsByScreen(JSON.parse(readFileSync(file, "utf8"))) : null;
      console.log(`${run.ok ? "PASS" : "FAIL"} ${testCase.name} ${width}: ${run.ok ? JSON.stringify(table[testCase.name][width]) : run.log}`);
    }
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
