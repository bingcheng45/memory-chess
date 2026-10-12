/**
 * Measures the result screen's dashboard figures with their reserve switched off, for each locale in LOCALES at ten
 * widths, and writes heights-<first locale>.json. It loads a persona whose figures are all ready, gives the game store
 * a rating and a win streak, and submits an empty board, so all ten figures show with their changes. The tallest
 * height per width across every locale is result-deltas-heights.json, which resultLabReserve.test.ts holds the reserve
 * above. A cdp.mjs drive script; a run of six locales fits its time limit.
 *
 *   npm run lab:personas -- --out <dir>
 *   PERSONA_FILE=<dir>/spanClimber.json LOCALES=en,de,fr node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
 *     scripts/lab/result-deltas-heights.mjs --evidence <out> --base http://127.0.0.1:<port>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPersona } from "./drive.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PERSONA = process.env.PERSONA_FILE;
const LOCALES = (process.env.LOCALES ?? "en").split(",");
const WIDTHS = [320, 360, 390, 639, 640, 768, 1000, 1023, 1024, 1440];
const FRAME = `document.querySelector('[data-testid="result-deltas-frame"]')`;
const SECTION = `document.querySelector('section[aria-labelledby="result-deltas-title"]')`;
const phaseIs = (phase) => `document.querySelector("[data-round-phase]")?.dataset.roundPhase === "${phase}"`;
const STANDING = JSON.stringify({ state: { gameState: { pieceCount: 14, memorizeTime: 10, level: 1, skillRating: 1500, streak: 5 }, history: [] }, version: 0 });

export default async function drive(page, { baseUrl, evidenceDir }) {
  await loadPersona(page, baseUrl, PERSONA);
  const heights = {};
  for (const locale of LOCALES) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    const round = JSON.parse(readFileSync(`${REPO}/messages/${locale}.json`, "utf8")).game.round;
    await page.eval(`localStorage.setItem("memory-chess-storage", ${JSON.stringify(STANDING)})`);
    await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.goto(`${baseUrl}${prefix}/game?pieceCount=14&memorizeTime=10&source=dashboard`);
    await page.waitFor(phaseIs("study"), 20_000);
    await page.clickText("button", round.done);
    await page.waitFor(phaseIs("rebuild"));
    await page.clickText("button", round.submit);
    await page.waitFor(`!!${SECTION}`, 20_000);
    await page.sleep(300);
    const start = await page.eval(`({ top: Math.round(${FRAME}.getBoundingClientRect().top + scrollY), reserved: ${FRAME}.className !== "" })`);
    await page.eval(`${FRAME}.className = ""`);
    heights[locale] = { rows: await page.eval(`${SECTION}.querySelectorAll("li").length`), at1440: start };
    for (const width of WIDTHS) {
      await page.send("Emulation.setDeviceMetricsOverride", { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: width < 600 });
      await page.sleep(150);
      heights[locale][width] = await page.eval(`Math.ceil(${SECTION}.getBoundingClientRect().height)`);
    }
  }
  writeFileSync(join(evidenceDir, `heights-${LOCALES[0]}.json`), JSON.stringify(heights, null, 2));
  return heights;
}
