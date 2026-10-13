#!/usr/bin/env node
/**
 * Measures each reserved §06 box with its reserve switched off, for every
 * persona file at nine widths and for the server render with scripts off, and
 * writes the tallest per layout tier to src/components/home/lab-heights.json,
 * with the tallest empty state a new visitor sees in each tier.
 * labReserves.test.ts holds the CSS reserves above those heights. The file is
 * a snapshot: rerun this after a copy or layout change to §06, and the test
 * then fails if a box outgrew its reserve. `--locales en,de,ru` measures each
 * of those homes. English and the translations are written as two sets, since
 * lab-instruments.css reserves for `.lab-paper:not(:lang(en))` separately; a run
 * that measures only one set keeps the other from the file. A drive script has
 * 180 s, so measure the translations about four locales per run.
 * The welcome back line shares the unlock strip's box, which the <name>Away
 * personas from lab:personas cover.
 *
 *   npm run lab:personas -- --out <dir> && npm run lab:heights -- --base http://localhost:3123 --personas <dir> [--out <evidence dir>] [--locales en,de,ru]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, BREAKPOINT_WIDTHS as WIDTHS, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const DATA_FILE = "src/components/home/lab-heights.json";
const RAW_FILE = "heights.json";
const LOCALES_ENV = "LAB_HEIGHTS_LOCALES";
const ENGLISH = "en";
const homeOf = (locale) => (locale === ENGLISH ? "/" : `/${locale}`);
// The CSS breakpoints the reserves change at: max-width 640px and max-width 1000px.
const tierOf = (width) => (width <= 640 ? "narrow" : width <= 1000 ? "medium" : "wide");
const BOXES = ["unlock", "span", "held", "spark", "speed", "heat", "streak", "bests", "types", "insights", "notebook", "plans", "goal", "daily", "curve", "board", "tools"];

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

// Waits for the parsed document, not the load event, which the ad frames can hold past the harness's 20 s on a slow network.
async function open(page, url) {
  await page.send("Page.navigate", { url: "about:blank" });
  await page.waitFor(`location.href === "about:blank"`, 5_000);
  await page.send("Page.navigate", { url });
  await page.waitFor(`location.href === ${JSON.stringify(url)} && document.readyState !== "loading"`, 20_000);
}

export default async function measure(page, { baseUrl, evidenceDir }) {
  const rounds = await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);

  const locales = process.env[LOCALES_ENV].split(",");
  const client = {};
  for (const locale of locales) {
    client[locale] = {};
    for (const width of WIDTHS) {
      await sized(page, width);
      await open(page, `${baseUrl}${homeOf(locale)}`);
      await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
      await page.sleep(800);
      client[locale][width] = await page.eval(MEASURE);
    }
  }
  await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  const server = {};
  for (const locale of locales) {
    server[locale] = {};
    for (const width of WIDTHS) {
      await sized(page, width);
      await open(page, `${baseUrl}${homeOf(locale)}`);
      server[locale][width] = await page.eval(MEASURE);
    }
  }
  writeFileSync(join(evidenceDir, RAW_FILE), JSON.stringify({ client, server }, null, 2));
  return { rounds };
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-heights");
  const { personas, out } = args;
  const localesAt = process.argv.indexOf("--locales");
  const locales = localesAt >= 0 ? process.argv[localesAt + 1].split(",") : [ENGLISH];
  process.env[LOCALES_ENV] = locales.join(",");
  const names = readdirSync(personas).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -5));

  const measured = {};
  for (const name of names) {
    const result = await runPersona(name, join(personas, `${name}.json`), args, import.meta.url);
    if (!result.ok) throw new Error(`${name} failed:\n${result.log}`);
    measured[name] = JSON.parse(readFileSync(join(out, name, RAW_FILE), "utf8"));
    console.log(`measured ${name}`);
  }

  const previous = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  const english = locales.filter((locale) => locale === ENGLISH);
  const translated = locales.filter((locale) => locale !== ENGLISH);
  const data = {
    widths: WIDTHS,
    personas: names,
    english: english.length > 0 ? aggregate(measured, english) : previous.english,
    translated: translated.length > 0 ? aggregate(measured, translated) : previous.translated,
  };
  writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(join(out, "measured.json"), JSON.stringify(measured, null, 2));
  console.log(`wrote ${DATA_FILE}`);
}

/**
 * The tallest height of each box per layout tier over `locales`, which persona set it, and the tallest empty state a
 * new visitor's server render shows. English and the translations get one each, since lab-instruments.css reserves
 * for them separately.
 */
export function aggregate(measured, locales) {
  const max = {};
  const tallest = {};
  for (const [name, { client, server }] of Object.entries(measured)) {
    for (const [view, byLocale] of [["client", client], ["server", server]]) {
      for (const locale of locales) {
        for (const [width, heights] of Object.entries(byLocale[locale] ?? {})) {
          const tier = (max[tierOf(Number(width))] ??= {});
          for (const box of BOXES) {
            if ((heights[box] ?? 0) <= (tier[box] ?? 0)) continue;
            tier[box] = heights[box];
            tallest[`${tierOf(Number(width))} ${box}`] = `${name} ${locale} ${view} ${width}`;
          }
        }
      }
    }
  }
  const empty = {};
  for (const locale of locales) {
    for (const [width, heights] of Object.entries(measured.newVisitor?.server[locale] ?? {})) {
      const tier = (empty[tierOf(Number(width))] ??= {});
      for (const box of BOXES) tier[box] = Math.max(tier[box] ?? 0, heights[box] ?? 0);
    }
  }
  return { locales, max, tallest, empty };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
