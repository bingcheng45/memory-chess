#!/usr/bin/env node
/**
 * Measures each reserved §06 box with its reserve switched off, for every
 * persona file at five widths and for the server render with scripts off, and
 * writes the tallest per layout tier to src/components/home/lab-heights.json.
 * labReserves.test.ts then holds the CSS reserves above those heights, so a
 * copy or layout change that outgrows a box fails a test instead of moving
 * the page.
 *
 *   npm run lab:personas -- --out <dir> && npm run lab:heights -- --base http://localhost:3123 --personas <dir> [--out <evidence dir>]
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { importFile } from "./drive.mjs";

const HARNESS = ".claude/skills/verify-memory-chess/helpers/cdp.mjs";
const DATA_FILE = "src/components/home/lab-heights.json";
const PERSONA_ENV = "LAB_HEIGHTS_PERSONA";
const RAW_FILE = "heights.json";
const WIDTHS = [320, 360, 390, 768, 1440];
// The CSS breakpoints the reserves change at: max-width 640px and max-width 1000px.
const tierOf = (width) => (width <= 640 ? "narrow" : width <= 1000 ? "medium" : "wide");
const BOXES = ["unlock", "spark", "heat", "streak", "bests", "types", "tools"];

const NATURAL = `#record .lab-dash > *, #record .lab-unlock, #record .lab-tools-slot { align-self: start !important; min-height: 0 !important; }`;
const MEASURE = `(() => {
  const style = document.createElement("style");
  style.textContent = ${JSON.stringify(NATURAL)};
  document.head.append(style);
  const record = document.getElementById("record");
  const height = (element) => (element ? Math.ceil(element.getBoundingClientRect().height) : 0);
  const panels = [...record.querySelectorAll(".lab-panel")].map((panel) => [[...panel.classList].find((name) => name.startsWith("lab-p-")).slice(6), height(panel)]);
  const result = { unlock: height(record.querySelector(".lab-unlock")), ...Object.fromEntries(panels), tools: height(record.querySelector(".lab-tools")) };
  style.remove();
  return result;
})()`;

async function sized(page, width) {
  await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
}

export default async function measure(page, { baseUrl, evidenceDir }) {
  const personaFile = process.env[PERSONA_ENV];
  const persona = JSON.parse(readFileSync(personaFile, "utf8"));
  await sized(page, 1440);
  await page.goto(`${baseUrl}/`);
  await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
  if (persona.rounds.length > 0) await importFile(page, personaFile);

  const client = {};
  for (const width of WIDTHS) {
    await sized(page, width);
    await page.goto(`${baseUrl}/`);
    await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
    await page.sleep(800);
    client[width] = await page.eval(MEASURE);
  }
  await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  const server = {};
  for (const width of WIDTHS) {
    await sized(page, width);
    await page.goto(`${baseUrl}/`);
    server[width] = await page.eval(MEASURE);
  }
  writeFileSync(join(evidenceDir, RAW_FILE), JSON.stringify({ client, server }, null, 2));
  return { rounds: persona.rounds.length };
}

function valueOf(argv, flag, fallback) {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

function runPersona(file, evidence, base) {
  mkdirSync(evidence, { recursive: true });
  return new Promise((done) => {
    const child = spawn(process.execPath, [HARNESS, fileURLToPath(import.meta.url), "--evidence", evidence, "--base", base], {
      env: { ...process.env, [PERSONA_ENV]: file },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let log = "";
    child.stdout.on("data", (chunk) => (log += chunk));
    child.stderr.on("data", (chunk) => (log += chunk));
    child.on("exit", (code) => done({ ok: code === 0, log: log.trim() }));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const base = valueOf(argv, "--base", "http://localhost:3121");
  const personas = resolve(valueOf(argv, "--personas", ".lab-personas"));
  const out = resolve(valueOf(argv, "--out", ".lab-heights"));
  const names = readdirSync(personas).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -5));

  const measured = {};
  for (const name of names) {
    const evidence = join(out, name);
    const result = await runPersona(join(personas, `${name}.json`), evidence, base);
    if (!result.ok) throw new Error(`${name} failed:\n${result.log}`);
    measured[name] = JSON.parse(readFileSync(join(evidence, RAW_FILE), "utf8"));
    console.log(`measured ${name}`);
  }

  const max = {};
  const tallest = {};
  for (const [name, { client, server }] of Object.entries(measured)) {
    for (const [view, byWidth] of [["client", client], ["server", server]]) {
      for (const [width, heights] of Object.entries(byWidth)) {
        const tier = (max[tierOf(Number(width))] ??= {});
        for (const box of BOXES) {
          if ((heights[box] ?? 0) <= (tier[box] ?? 0)) continue;
          tier[box] = heights[box];
          tallest[`${tierOf(Number(width))} ${box}`] = `${name} ${view} ${width}`;
        }
      }
    }
  }
  writeFileSync(DATA_FILE, `${JSON.stringify({ widths: WIDTHS, personas: names, max, tallest }, null, 2)}\n`);
  writeFileSync(join(out, "measured.json"), JSON.stringify(measured, null, 2));
  console.log(`wrote ${DATA_FILE}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
