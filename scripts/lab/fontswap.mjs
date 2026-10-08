#!/usr/bin/env node
/**
 * Proves the Geist Mono swap moves nothing, in Chrome and in Safari. Lays out the
 * home page twice at 390 and 1440 wide, once with the Geist Mono files failed so
 * the local fallback face paints for good, once with them loaded, and requires the
 * top and height of every block on the page to match. Safari ignores ascent-,
 * descent- and line-gap-override, so a second pass rewrites the local face without
 * them and compares again: that pass only holds when every mono line box has an
 * explicit line-height. With the files failed, mono text at weight 600 or more must
 * paint in a bold local font, because a synthesized bold is wider in WebKit, and
 * its width must match the loaded state to within WIDTH_TOLERANCE_PX.
 *
 *   npm run lab:personas && npm run lab:fontswap -- --base http://localhost:3128 --out <dir> [--only <persona>]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { MONO_STATUS, monoFontUrls } from "./cls.mjs";
import { argsOf, loadPersona, PERSONA_ENV, runPersona, sized } from "./drive.mjs";

const WIDTHS = [390, 1440];
const PERSONAS = ["newVisitor", "thirtyDays"];
const RESULT_FILE = "fontswap.json";
const SETTLE_MS = 2500;
const BOLD_MARK = "data-fontswap-bold";
// At 13 to 22px Chrome lays the size-adjusted Menlo glyphs out up to 0.06 percent narrower than 0.600em (exact at
// 100px and up), and text rects snap to 1/64px, so the fallback may be 0.12px short on a 216px line.
const WIDTH_TOLERANCE_PX = 0.25;

// Rewrites the local fallback faces in place without the three descriptors Safari ignores.
const STRIP_OVERRIDES = `(() => {
  const strip = () => {
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];
        if (!(rule instanceof CSSFontFaceRule) || !/(ascent|descent|line-gap)-override/.test(rule.cssText)) continue;
        const stripped = rule.cssText.replace(/(ascent|descent|line-gap)-override:[^;]+;/g, "");
        sheet.deleteRule(index);
        sheet.insertRule(stripped, index);
        window.__stripped = (window.__stripped ?? 0) + 1;
      }
    }
  };
  document.addEventListener("DOMContentLoaded", strip);
  addEventListener("load", strip);
})();`;

const BLOCKS = `[...document.body.querySelectorAll("*")]
  .filter((element) => !element.closest("svg, script, style, noscript, template") && !["inline", "contents", "none"].includes(getComputedStyle(element).display))
  .map((element) => {
    const rect = element.getBoundingClientRect();
    const label = element.tagName.toLowerCase() + (typeof element.className === "string" && element.className ? "." + element.className.split(" ")[0] : "");
    return [label, Math.round((rect.top + scrollY) * 100) / 100, Math.round(rect.height * 100) / 100];
  })`;

const BOLD_MONO = `[...document.body.querySelectorAll("*")]
  .filter((element) => {
    const style = getComputedStyle(element);
    return style.fontFamily.includes("Geist Mono") && Number(style.fontWeight) >= 600 && style.display !== "none"
      && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
  })
  .map((element, index) => {
    element.setAttribute(${JSON.stringify(BOLD_MARK)}, String(index));
    const range = document.createRange();
    range.selectNodeContents(element);
    return { label: element.tagName.toLowerCase() + "." + String(element.className).split(" ")[0], weight: getComputedStyle(element).fontWeight, text: element.textContent.trim().slice(0, 24), width: Math.round(range.getBoundingClientRect().width * 100) / 100 };
  })`;

async function platformFonts(page) {
  await page.send("DOM.enable");
  await page.send("CSS.enable");
  const { root } = await page.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await page.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: `[${BOLD_MARK}]` });
  const fonts = [];
  for (const nodeId of nodeIds) {
    const { fonts: used } = await page.send("CSS.getPlatformFontsForNode", { nodeId });
    fonts.push(used.map(({ familyName, postScriptName, isCustomFont }) => `${postScriptName || familyName}${isCustomFont ? " (web)" : ""}`));
  }
  return fonts;
}

async function layout(page, url, state) {
  await page.goto("about:blank");
  await page.goto(url);
  await page.waitFor(`!!document.querySelector(".lab-tools")`, 20_000);
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(SETTLE_MS);
  const status = await page.eval(MONO_STATUS);
  const wanted = state === "fallback" ? "error" : "loaded";
  if (!status.includes(wanted) || (state === "fallback" && status.includes("loaded"))) throw new Error(`${state}: Geist Mono status ${JSON.stringify(status)}`);
  const bold = await page.eval(BOLD_MONO);
  const fonts = state === "fallback" ? await platformFonts(page) : [];
  return { blocks: await page.eval(BLOCKS), bold: bold.map((entry, index) => ({ ...entry, fonts: fonts[index] })), stripped: await page.eval("window.__stripped ?? 0") };
}

function compare(fallback, loaded) {
  const blockDiffs = fallback.blocks.length !== loaded.blocks.length
    ? [`block count ${fallback.blocks.length} vs ${loaded.blocks.length}`]
    : fallback.blocks.flatMap(([label, top, height], index) => {
        const [, loadedTop, loadedHeight] = loaded.blocks[index];
        return top === loadedTop && height === loadedHeight ? [] : [`${index} ${label}: top ${top} vs ${loadedTop}, height ${height} vs ${loadedHeight}`];
      });
  const widthDiffs = fallback.bold.flatMap(({ label, text, width }, index) => {
    const loadedWidth = loaded.bold[index]?.width;
    return Math.abs(loadedWidth - width) <= WIDTH_TOLERANCE_PX ? [] : [`${label} "${text}": width ${width} vs ${loadedWidth}`];
  });
  const synthesized = fallback.bold.filter(({ width, fonts }) => width > 0 && !fonts.some((font) => /bold/i.test(font))).map(({ label, text, fonts }) => `${label} "${text}" painted in ${fonts.join(", ")}`);
  return { blocks: fallback.blocks.length, boldTexts: fallback.bold.length, blockDiffs, widthDiffs, synthesized };
}

export default async function measure(page, { baseUrl, evidenceDir }) {
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  await sized(page, 1440);
  const urls = await monoFontUrls(page, baseUrl);
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  page.on((method, params) => {
    if (method === "Fetch.requestPaused") page.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "Failed" });
  });

  const fallbackAt = async (width) => {
    await sized(page, width, width < 600 ? 844 : 900);
    await page.send("Fetch.enable", { patterns: urls.map((urlPattern) => ({ urlPattern })) });
    const fallback = await layout(page, `${baseUrl}/`, "fallback");
    await page.send("Fetch.disable");
    return fallback;
  };
  // The loaded state never uses the local face, so the Safari pass compares against the same loaded layout.
  const loaded = {};
  const result = {};
  for (const width of WIDTHS) {
    const fallback = await fallbackAt(width);
    loaded[width] = await layout(page, `${baseUrl}/`, "loaded");
    result[`declared ${width}`] = { ...compare(fallback, loaded[width]), bold: fallback.bold };
  }
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: STRIP_OVERRIDES });
  for (const width of WIDTHS) {
    const fallback = await fallbackAt(width);
    if (fallback.stripped === 0) throw new Error("safari pass found no override descriptors to strip");
    result[`safari ${width}`] = { ...compare(fallback, loaded[width]), bold: fallback.bold };
  }
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  const failed = Object.entries(result).filter(([, { blockDiffs, widthDiffs, synthesized }]) => blockDiffs.length + widthDiffs.length + synthesized.length > 0);
  if (failed.length > 0) {
    throw new Error(failed.map(([key, { blockDiffs, widthDiffs, synthesized }]) => `${key}: ${[...blockDiffs.slice(0, 6), ...widthDiffs.slice(0, 4), ...synthesized.slice(0, 4)].join("; ")} (${blockDiffs.length} block, ${widthDiffs.length} width, ${synthesized.length} synthesized bold)`).join("\n"));
  }
  return Object.fromEntries(Object.entries(result).map(([key, { blocks, boldTexts }]) => [key, { blocks, boldTexts }]));
}

async function main() {
  const args = argsOf(process.argv.slice(2), ".lab-fontswap", "http://localhost:3128");
  let ok = true;
  for (const name of PERSONAS.filter((persona) => !args.only || persona === args.only)) {
    const run = await runPersona(name, join(args.personas, `${name}.json`), args, import.meta.url);
    ok &&= run.ok;
    console.log(`${run.ok ? "PASS" : "FAIL"} ${name}: ${run.log}`);
  }
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
