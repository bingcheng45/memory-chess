#!/usr/bin/env node
/**
 * Measures each reserved §06 box with its reserve switched off, for every
 * persona file at nine widths and for the server render with scripts off, and
 * writes the tallest per layout tier to src/components/home/lab-heights.json,
 * with the tallest empty state a new visitor sees in each tier.
 * labReserves.test.ts holds the CSS reserves above those heights. The file is
 * a snapshot: rerun this after a copy or layout change to §06, and the test
 * then fails if a box outgrew its reserve.
 * The welcome back line shares the unlock strip's box, which the <name>Away
 * personas from lab:personas cover.
 *
 *   npm run lab:personas -- --out <dir> && npm run lab:heights -- --base http://localhost:3123 --personas <dir> [--out <evidence dir>]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, BREAKPOINT_WIDTHS as WIDTHS, importFile, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const DATA_FILE = "src/components/home/lab-heights.json";
const RAW_FILE = "heights.json";
// The CSS breakpoints the reserves change at: max-width 640px and max-width 1000px.
const tierOf = (width) => (width <= 640 ? "narrow" : width <= 1000 ? "medium" : "wide");
const BOXES = ["unlock", "span", "held", "spark", "speed", "heat", "streak", "bests", "types", "insights", "notebook", "tools"];

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

export default async function measure(page, { baseUrl, evidenceDir }) {
  const personaFile = process.env[PERSONA_ENV];
  const persona = JSON.parse(readFileSync(personaFile, "utf8"));
  if (persona.rounds.length > 0) {
    await sized(page, 1440);
    await page.goto(`${baseUrl}/`);
    await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
    await importFile(page, personaFile);
  }

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

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-heights");
  const { personas, out } = args;
  const names = readdirSync(personas).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -5));

  const measured = {};
  for (const name of names) {
    const result = await runPersona(name, join(personas, `${name}.json`), args, import.meta.url);
    if (!result.ok) throw new Error(`${name} failed:\n${result.log}`);
    measured[name] = JSON.parse(readFileSync(join(out, name, RAW_FILE), "utf8"));
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
  const empty = {};
  for (const [width, heights] of Object.entries(measured.newVisitor?.server ?? {})) {
    const tier = (empty[tierOf(Number(width))] ??= {});
    for (const box of BOXES) tier[box] = Math.max(tier[box] ?? 0, heights[box] ?? 0);
  }
  writeFileSync(DATA_FILE, `${JSON.stringify({ widths: WIDTHS, personas: names, max, tallest, empty }, null, 2)}\n`);
  writeFileSync(join(out, "measured.json"), JSON.stringify(measured, null, 2));
  console.log(`wrote ${DATA_FILE}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
