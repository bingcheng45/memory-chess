#!/usr/bin/env node
/**
 * Loads every lab persona into a fresh browser profile through the real Import
 * control and records what §06 shows: a screenshot of the section and of each
 * panel at 390 and 1440 wide, and each panel's visible text. The text snapshot
 * is the baseline a later change diffs against, so "renders the same for every
 * player" is a command, not an eyeball. Fails on horizontal overflow, an
 * unexpected console error, or server-rendered main-content text that a
 * stylesheet hides at any of BREAKPOINT_WIDTHS: the AdSense audit reads served HTML
 * only, so it cannot see a rule like `li + li { display: none }`.
 *
 *   npm run lab:personas && npm run lab:drive -- --base http://localhost:3121 --out <dir> [--compare <snapshot.json>] [--only <persona>]
 *
 * Each persona runs as its own drive script under the verify-memory-chess CDP
 * harness, which launches Chrome on a new temporary profile per run.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HARNESS = ".claude/skills/verify-memory-chess/helpers/cdp.mjs";
const WIDTHS = [1440, 390];
export const PERSONA_ENV = "LAB_DRIVE_PERSONA";
const TEXT_FILE = "text.json";
// Phones from the narrowest up, then both sides of the 640px and 1000px breakpoints the §06 layout changes at.
export const BREAKPOINT_WIDTHS = [320, 360, 390, 640, 641, 768, 1000, 1024, 1440];
// Hidden before this check existed, outside the lab record: on phones the tiers table moves its header words into
// each cell's label. Listed so the run stays green while any new hidden text fails it.
const KNOWN_HIDDEN = [".lab-proto thead"];
// Environment noise, not app faults: Vercel scripts that exist only on Vercel, Supabase and the
// stats API without local credentials, and headless Chrome refusing audio without a gesture.
const ENVIRONMENT_ERRORS = [/\/_vercel\//, /Supabase|game-stats|\/api\/leaderboard/, /NotAllowedError|failed to play sound/i];

const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

const PANEL_TEXT = `(() => {
  const record = document.getElementById("record");
  const entries = [...record.querySelectorAll(".lab-panel")].map((panel) => {
    const key = [...panel.classList].find((name) => name.startsWith("lab-p-")).slice(6);
    return [key, panel.innerText];
  });
  const tools = record.querySelector(".lab-tools");
  const unlock = record.querySelector(".lab-unlock");
  return Object.fromEntries([["unlock", unlock.innerText], ...entries, ["tools", tools ? tools.innerText : null]]);
})()`;

const rectOf = (selector) => `(() => {
  const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 };
})()`;

async function shoot(page, selector, file) {
  const clip = await page.eval(rectOf(selector));
  const { data } = await page.send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
  writeFileSync(file, Buffer.from(data, "base64"));
}

/** Text under main, outside nav, that the computed style hides: display none or visibility hidden on it or an ancestor. */
const HIDDEN_TEXT = `(() => {
  const known = ${JSON.stringify(KNOWN_HIDDEN)};
  const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  const hidden = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    const text = node.textContent.trim();
    if (!text || element.closest("nav, script, style, noscript, template, details:not([open])")) continue;
    if (known.some((selector) => element.closest(selector))) continue;
    if (!element.checkVisibility({ visibilityProperty: true })) hidden.push(text.slice(0, 60));
  }
  return hidden;
})()`;

export async function sized(page, width) {
  await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
}

/** Loads the server render with scripts off at each width and lists the text a stylesheet hides there. */
async function serverHiddenText(page, baseUrl) {
  await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  const hidden = {};
  for (const width of BREAKPOINT_WIDTHS) {
    await sized(page, width);
    await page.goto(`${baseUrl}/`);
    const text = await page.eval(HIDDEN_TEXT);
    if (text.length > 0) hidden[width] = text;
  }
  await page.send("Emulation.setScriptExecutionDisabled", { value: false });
  return hidden;
}

export async function importFile(page, file) {
  await page.send("DOM.enable");
  const { root } = await page.send("DOM.getDocument", {});
  const { nodeId } = await page.send("DOM.querySelector", { nodeId: root.nodeId, selector: '.lab-tools input[type="file"]' });
  await page.send("DOM.setFileInputFiles", { nodeId, files: [file] });
  return page.waitFor(`document.querySelector('.lab-tools p[role="status"]').textContent.trim() || null`, 60_000);
}

export default async function drive(page, { baseUrl, evidenceDir }) {
  const personaFile = process.env[PERSONA_ENV];
  const persona = JSON.parse(readFileSync(personaFile, "utf8"));
  const consoleErrors = [];
  await page.send("Runtime.enable");
  await page.send("Log.enable");
  page.on((method, params) => {
    if (method === "Runtime.consoleAPICalled" && params.type === "error") {
      consoleErrors.push(params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
    if (method === "Runtime.exceptionThrown") consoleErrors.push(params.exceptionDetails.text);
    if (method === "Log.entryAdded" && params.entry.level === "error") consoleErrors.push(`${params.entry.text} [${params.entry.url ?? ""}]`);
  });

  await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto(`${baseUrl}/`);
  await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
  const notice = persona.rounds.length > 0 ? await importFile(page, personaFile) : null;
  await page.sleep(500);

  const text = {};
  const overflow = {};
  for (const width of WIDTHS) {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await page.eval(`document.getElementById("record").scrollIntoView()`);
    await page.sleep(500);
    overflow[width] = (await page.eval("document.documentElement.scrollWidth")) - width;
    text[width] = await page.eval(PANEL_TEXT);
    await shoot(page, "#record", join(evidenceDir, `record-${width}.png`));
    await shoot(page, "#record .lab-unlock", join(evidenceDir, `unlock-${width}.png`));
    for (const panel of Object.keys(text[width]).filter((key) => key !== "tools" && key !== "unlock")) {
      await shoot(page, `#record .lab-p-${panel}`, join(evidenceDir, `${panel}-${width}.png`));
    }
  }
  writeFileSync(join(evidenceDir, TEXT_FILE), JSON.stringify(text, null, 2));

  const unexpected = consoleErrors.filter((message) => !ENVIRONMENT_ERRORS.some((pattern) => pattern.test(message)));
  writeFileSync(join(evidenceDir, "console-errors.txt"), consoleErrors.join("\n"));
  const hidden = await serverHiddenText(page, baseUrl);
  assert(Object.keys(hidden).length === 0, `server-rendered main-content text hidden at some viewport: ${JSON.stringify(hidden)}`);
  assert(WIDTHS.every((width) => overflow[width] <= 0), `horizontal overflow ${JSON.stringify(overflow)}`);
  assert(unexpected.length === 0, `console errors: ${unexpected.join(" | ")}`);
  return { rounds: persona.rounds.length, notice, overflow, consoleErrors: consoleErrors.length };
}

export function argsOf(argv, out = ".lab-drive") {
  const value = (flag, fallback) => {
    const index = argv.indexOf(flag);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    base: value("--base", "http://localhost:3121"),
    out: resolve(value("--out", out)),
    personas: resolve(value("--personas", ".lab-personas")),
    compare: value("--compare", null),
    only: value("--only", null),
  };
}

/** Runs `script` (this drive by default) under the harness, in a fresh profile, with the persona file in PERSONA_ENV. */
export function runPersona(name, file, { base, out }, script = import.meta.url) {
  const evidence = join(out, name);
  mkdirSync(evidence, { recursive: true });
  return new Promise((done) => {
    const child = spawn(process.execPath, [HARNESS, fileURLToPath(script), "--evidence", evidence, "--base", base], {
      env: { ...process.env, [PERSONA_ENV]: file },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let log = "";
    child.stdout.on("data", (chunk) => (log += chunk));
    child.stderr.on("data", (chunk) => (log += chunk));
    child.on("exit", (code) => done({ name, ok: code === 0, log: code === 0 ? log.trim().split("\n").at(-1) : log.trim() }));
  });
}

function differences(baseline, snapshot, personas) {
  const keys = (a, b) => [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])];
  return personas.flatMap((persona) =>
    keys(baseline[persona], snapshot[persona]).flatMap((width) =>
      keys(baseline[persona]?.[width], snapshot[persona]?.[width]).flatMap((panel) =>
        baseline[persona]?.[width]?.[panel] === snapshot[persona]?.[width]?.[panel] ? [] : [`${persona} ${width} ${panel}`],
      ),
    ),
  );
}

async function main() {
  const args = argsOf(process.argv.slice(2));
  const names = readdirSync(args.personas)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -5))
    .filter((name) => !args.only || name === args.only);
  assert(names.length > 0, `no personas in ${args.personas}, run npm run lab:personas first`);

  const results = [];
  for (const name of names) {
    const result = await runPersona(name, join(args.personas, `${name}.json`), args);
    console.log(`${result.ok ? "PASS" : "FAIL"} ${name}: ${result.log}`);
    results.push(result);
  }
  const snapshot = Object.fromEntries(
    results.filter(({ ok }) => ok).map(({ name }) => [name, JSON.parse(readFileSync(join(args.out, name, TEXT_FILE), "utf8"))]),
  );
  writeFileSync(join(args.out, "snapshot.json"), JSON.stringify(snapshot, null, 2));
  console.log(`snapshot: ${join(args.out, "snapshot.json")}`);

  const baseline = args.compare ? JSON.parse(readFileSync(args.compare, "utf8")) : null;
  const unbased = baseline ? names.filter((name) => !(name in baseline)) : [];
  const changed = baseline ? differences(baseline, snapshot, names.filter((name) => name in baseline)) : [];
  if (unbased.length > 0) console.log(`no baseline for ${unbased.join(", ")}, not compared`);
  if (args.compare) console.log(changed.length === 0 ? `same text as ${args.compare}` : `changed text:\n  ${changed.join("\n  ")}`);
  process.exit(results.every(({ ok }) => ok) && changed.length === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
