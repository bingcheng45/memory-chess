#!/usr/bin/env node
/**
 * Measures how much wider each webfont sets the site's own text than local Arial, per
 * weight, so the fallback faces in globals.css can be sized to it. On every page in
 * PAGES and every locale in LOCALES, each text node drawn in Geist, Noto Sans or Open
 * Sans is measured on one line in its webfont and again in Arial Regular (weights under
 * 550) or Arial Bold, both at 100%. Prints, per family and weight, the summed webfont
 * width over the summed Arial width: the size-adjust that makes a fallback line as long
 * as the webfont line on average, with the 10th and 90th percentile of single texts,
 * beside the size-adjust globals.css ships for that weight. Where the two differ,
 * globals.css says why next to the face.
 *
 *   npm run lab:fallback-widths -- --base http://localhost:3128 --out <dir>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, runPersona, sized } from "./drive.mjs";

const LOCALES = ["en", "de", "fi", "ru", "pt-BR", "pl", "hu", "fr", "es", "it", "tr", "cs", "ro", "nl", "sv", "vi"];
const PAGES = ["", "/game", "/leaderboard"];
const WIDTH = 1280;
const SETTLE_MS = 2000;
const MIN_TEXT_PX = 40;
const RESULT_FILE = "fallback-widths.json";
const LOCALE_ENV = "LAB_FALLBACK_LOCALE";

const MEASURE = `(async () => {
  await document.fonts.ready;
  for (const [src, weight] of [["local('Arial')", "100 549"], ["local('Arial Bold')", "550 900"]]) {
    const face = new FontFace("Lab Arial", src, { weight });
    await face.load();
    document.fonts.add(face);
  }
  const width = (element) => [...element.childNodes]
    .filter((node) => node.nodeType === 3 && node.textContent.trim())
    .reduce((sum, node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return sum + [...range.getClientRects()].reduce((total, rect) => total + rect.width, 0);
    }, 0);
  const texts = [...document.body.querySelectorAll("*")]
    .filter((element) => !element.closest("svg, script, style, noscript, template") && element.getClientRects().length && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()))
    .map((element) => ({ element, family: getComputedStyle(element).fontFamily.split(",")[0].trim().replace(/['"]/g, ""), weight: getComputedStyle(element).fontWeight }))
    .filter(({ family }) => ["Geist", "Noto Sans", "Open Sans"].includes(family));
  texts.forEach(({ element }) => (element.style.whiteSpace = "nowrap"));
  texts.forEach((text) => (text.web = width(text.element)));
  texts.forEach(({ element }) => (element.style.fontFamily = "'Lab Arial'"));
  texts.forEach((text) => (text.arial = width(text.element)));
  texts.forEach(({ element }) => element.removeAttribute("style"));
  return texts.map(({ family, weight, web, arial }) => ({ family, weight, web, arial }));
})()`;

export default async function measure(page, { baseUrl, evidenceDir }) {
  const locale = process.env[LOCALE_ENV];
  await sized(page, WIDTH);
  const texts = [];
  for (const path of PAGES) {
    await page.goto(`${baseUrl}${locale === "en" ? "" : `/${locale}`}${path}`);
    await page.sleep(SETTLE_MS);
    texts.push(...(await page.eval(MEASURE)));
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(texts));
  return texts.length;
}

const shippedFaces = () =>
  [...readFileSync("src/app/globals.css", "utf8").matchAll(/@font-face\s*{([^}]*)}/g)]
    .map(([, body]) => Object.fromEntries([...body.matchAll(/([\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()])))
    .filter((face) => / Arial"$/.test(face["font-family"] ?? ""))
    .map((face) => ({ family: face["font-family"].replace(/"/g, "").replace(/ Arial$/, ""), range: face["font-weight"].split(" ").map(Number), sizeAdjust: Number((parseFloat(face["size-adjust"]) / 100).toFixed(4)) }));

function shippedOf(faces, family, weight) {
  return faces.find((face) => face.family === family && face.range[0] <= weight && weight <= face.range[1])?.sizeAdjust ?? null;
}

function summarize(texts) {
  const faces = shippedFaces();
  const groups = Object.groupBy(texts, ({ family, weight }) => `${family} ${weight}`);
  return Object.fromEntries(
    Object.entries(groups)
      .filter(([, group]) => group.some(({ web }) => web >= MIN_TEXT_PX))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, group]) => {
        const ratios = group.filter(({ web }) => web >= MIN_TEXT_PX).map(({ web, arial }) => web / arial).sort((a, b) => a - b);
        const at = (share) => Number(ratios[Math.floor(ratios.length * share)]?.toFixed(3));
        const sum = (field) => group.reduce((total, text) => total + text[field], 0);
        const { family, weight } = group[0];
        return [key, { sizeAdjust: Number((sum("web") / sum("arial")).toFixed(4)), shipped: shippedOf(faces, family, Number(weight)), texts: ratios.length, p10: at(0.1), p90: at(0.9) }];
      }),
  );
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-fallback-widths", "http://localhost:3128");
  const texts = [];
  for (const locale of LOCALES) {
    process.env[LOCALE_ENV] = locale;
    const run = await runPersona(locale, "", args, import.meta.url);
    if (!run.ok) {
      console.log(`FAIL ${locale}: ${run.log}`);
      process.exit(1);
    }
    texts.push(...JSON.parse(readFileSync(join(args.out, locale, RESULT_FILE), "utf8")));
  }
  const table = summarize(texts);
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  console.table(table);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
