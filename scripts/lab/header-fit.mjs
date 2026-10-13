#!/usr/bin/env node
/**
 * Fits the Lab Paper header row to every locale, in a real browser, each locale in a fresh profile.
 *
 * Check (the default): each page loads once per locale and is resized through WIDTHS. At each width the header row
 * must not scroll sideways, no header element may end past the viewport, Play must show (except on /game, and below
 * 360px where it moves into the menu), and the streak chip must show for a player with a streak. Runs for a new
 * visitor and for threeDays, whose chip shows. Prints the failing cells and writes every measurement to table.json.
 *
 * --write: measures each header part's natural width per locale and page, with the chip showing, and writes
 * FIT_CSS: per locale, the viewport widths below which Play drops its long label, About leaves the row, and the nav
 * and language picker fold into the menu. Each width is the narrowest at which the part fits on every page, so a link
 * is in the same place on every page. Rerun it after changing nav, Play or section-menu copy, then run the check.
 *
 *   npm run lab:personas && npm run lab:header-fit -- --base http://localhost:4531 --out <dir> [--only <locale>] [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { argsOf, blockAds, loadPersona, PERSONA_ENV, runPersonaPool, sized } from "./drive.mjs";
import "./ts-hooks.mjs";

const CASE_ENV = "LAB_HEADER_FIT_CASE";
const RESULT_FILE = "header.json";
const FIT_CSS = "src/components/lab-paper/lab-header-fit.css";
const { LOCALES } = await import(pathToFileURL(join(process.cwd(), "src/i18n/routing.ts")).href);
const PATHS = ["/", "/game", "/dashboard", "/changelog", "/terms"];
const WIDTHS = [1440, 1280, 1180, 1081, 1080, 1024, 900, 861, 860, 768, 600, 481, 480, 390, 360, 320];
const PERSONAS = [
  { name: "newVisitor", streak: false },
  { name: "threeDays", streak: true },
];
const PLAY_MIN_WIDTH = 360;
const CONCURRENCY = 4;
// lab-paper.css: .lab-wrap is at most 1200px wide with a clamp(16px, 4vw, 48px) gutter, and the row's gaps.
const WRAP_MAX = 1200;
const GUTTER = { min: 16, vw: 0.04, max: 48 };
const ROW_GAP = 24;
const NAV_GAP = 2;
const SECTIONS_MARGIN = 6;
const TOOLS_GAP = 8;
// A classic scrollbar (about 17px) narrows the row without narrowing the media query, and a streak of two or three
// digits widens the chip; one-digit threeDays is what gets measured.
const SLACK = 24;
// The phone layout below this width is fixed in lab-paper.css, so a fold never starts lower.
const PHONE_MAX = 480;

const rowWidthAt = (viewport) => Math.min(viewport, WRAP_MAX) - 2 * Math.min(GUTTER.max, Math.max(GUTTER.min, GUTTER.vw * viewport));

const MEASURE = `(() => {
  const row = document.querySelector(".lab-header-row");
  const visible = [...row.querySelectorAll("*")].filter((element) => element.checkVisibility());
  const past = visible.filter((element) => element.getBoundingClientRect().right > innerWidth + 0.5);
  const play = row.querySelector(".lab-btn-primary");
  const shown = (element) => !!element && element.checkVisibility();
  return {
    rowWidth: row.clientWidth,
    scroll: row.scrollWidth - row.clientWidth,
    past: past.length === 0 ? 0 : Math.ceil(Math.max(...past.map((element) => element.getBoundingClientRect().right)) - innerWidth),
    play: shown(play),
    playLabel: [...(play?.querySelectorAll("span") ?? [])].find(shown)?.textContent ?? null,
    chip: shown(row.querySelector(".lab-streak-chip")),
    links: [...row.querySelectorAll(".lab-nav-link")].filter(shown).length,
    sections: shown(row.querySelector(".lab-nav-trigger")),
  };
})()`;

/**
 * Natural widths at 1440: the row may grow past the wrap and nothing shrinks, and FIT_CSS is switched off, since its
 * rules match html[lang] exactly and a private-use subtag keeps the language the browser picks fonts by. Each path
 * loads fresh, so nothing here is undone.
 */
const PARTS = `(() => {
  document.documentElement.lang += "-x-fit";
  const row = document.querySelector(".lab-header-row");
  row.parentElement.style.maxWidth = "none";
  row.style.width = "max-content";
  row.querySelectorAll("*").forEach((element) => (element.style.flexShrink = "0"));
  const width = (element) => (element ? element.getBoundingClientRect().width : 0);
  const play = row.querySelector(".lab-btn-primary");
  const label = (long) => {
    play.querySelector(".lab-play-long").style.display = long ? "inline" : "none";
    play.querySelector(".lab-play-short").style.display = long ? "none" : "inline";
    return width(play);
  };
  const parts = {
    wordmark: width(row.querySelector(".lab-wordmark")),
    links: [...row.querySelectorAll(".lab-nav-link")].map((link) => ({ width: width(link), extra: link.classList.contains("lab-nav-extra") })),
    sections: width(row.querySelector(".lab-nav-item")),
    tools: [...row.querySelector(".lab-header-tools").children].filter((tool) => tool !== play && tool.checkVisibility()).map(width),
    playLong: play ? label(true) : 0,
    playShort: play ? label(false) : 0,
  };
  return parts;
})()`;

const prefixOf = (locale) => (locale === "en" ? "" : `/${locale}`);

async function open(page, baseUrl, locale, path, streak) {
  await page.goto(`${baseUrl}${prefixOf(locale)}${path === "/" ? "" : path}`);
  await page.waitFor(`!!document.querySelector(".lab-header-row") && document.fonts.ready.then(() => true)`, 20_000);
  if (streak) await page.waitFor(`!!document.querySelector(".lab-streak-chip")`, 20_000);
}

function failuresOf(cell, { path, width, streak }) {
  const failures = [];
  if (cell.scroll > 0) failures.push(`row scrolls ${cell.scroll}px`);
  if (cell.past > 0) failures.push(`ends ${cell.past}px past the viewport`);
  if (path !== "/game" && width >= PLAY_MIN_WIDTH && !cell.play) failures.push("Play hidden");
  if (streak && !cell.chip) failures.push("streak chip hidden");
  return failures;
}

async function check(page, { baseUrl, locale, streak }) {
  const result = {};
  for (const path of PATHS) {
    result[path] = {};
    await sized(page, WIDTHS[0]);
    await open(page, baseUrl, locale, path, streak);
    for (const width of WIDTHS) {
      await sized(page, width);
      await page.eval("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      const cell = await page.eval(MEASURE);
      if (Math.abs(cell.rowWidth - rowWidthAt(width)) > 1) throw new Error(`row is ${cell.rowWidth}px at ${width}, rowWidthAt says ${rowWidthAt(width)}; update WRAP_MAX or GUTTER`);
      result[path][width] = { ...cell, failures: failuresOf(cell, { path, width, streak }) };
    }
  }
  return result;
}

async function parts(page, { baseUrl, locale }) {
  await sized(page, WIDTHS[0]);
  const result = {};
  for (const path of PATHS) {
    await open(page, baseUrl, locale, path, true);
    result[path] = await page.eval(PARTS);
  }
  return result;
}

export default async function headerFit(page, { baseUrl, evidenceDir }) {
  const testCase = JSON.parse(process.env[CASE_ENV]);
  await blockAds(page);
  await loadPersona(page, baseUrl, process.env[PERSONA_ENV]);
  const result = await (testCase.write ? parts : check)(page, { baseUrl, ...testCase });
  writeFileSync(join(evidenceDir, RESULT_FILE), JSON.stringify(result, null, 2));
  return { locale: testCase.locale };
}

const sum = (widths, gap) => (widths.length === 0 ? 0 : widths.reduce((total, width) => total + width, 0) + gap * (widths.length - 1));

/** The row width a page's header needs, with or without About and Play's long label. */
function rowNeed(part, { about, long }) {
  const links = part.links.filter((link) => about || !link.extra).map((link) => link.width);
  const nav = sum(links, NAV_GAP) + (part.sections ? NAV_GAP + SECTIONS_MARGIN + part.sections : 0);
  const play = part.playLong ? [long ? part.playLong : part.playShort] : [];
  return Math.ceil(part.wordmark + ROW_GAP + nav + ROW_GAP + sum([...part.tools, ...play], TOOLS_GAP) + SLACK);
}

/** The narrowest viewport whose row holds `need`, or null when even the widest row does not. */
function viewportFor(need) {
  for (let viewport = PHONE_MAX + 1; viewport <= WRAP_MAX * 2; viewport++) if (rowWidthAt(viewport) >= need) return viewport;
  return null;
}

/** Per locale: Play's long label, About and the nav each show from these viewport widths; null never shows it. */
function foldsOf(partsByPath) {
  const pages = Object.values(partsByPath);
  const widest = (needs) => (needs.includes(null) ? null : Math.max(...needs));
  return {
    long: widest(pages.filter((part) => part.playLong > part.playShort).map((part) => viewportFor(rowNeed(part, { about: true, long: true })))),
    about: widest(pages.map((part) => viewportFor(rowNeed(part, { about: true, long: false })))),
    nav: widest(pages.map((part) => viewportFor(rowNeed(part, { about: false, long: false })))),
  };
}

const below = (from) => (from === null ? "all" : `(max-width: ${from - 1}px)`);
const labels = (long) => [`.lab-play-long { display: ${long ? "inline" : "none"}; }`, `.lab-play-short { display: ${long ? "none" : "inline"}; }`];

/** In cascade order, so the folded nav brings the long label back. Phones get their folded layout from lab-paper.css. */
const FOLDS = [
  { from: "long", media: below, rules: labels(false) },
  { from: "about", media: below, rules: [".lab-nav-extra { display: none; }", ".lab-dropdown { left: auto; right: 0; }"] },
  {
    from: "nav",
    media: (from) => `(min-width: ${PHONE_MAX + 1}px) and ${below(from)}`,
    rules: [".lab-nav, .lab-header-tools .lab-lang { display: none; }", ".lab-menu-btn { display: inline-flex; }", ".lab-header-row { gap: 12px; }", ...labels(true)],
  },
];

function fitCss(foldsByLocale) {
  const groups = new Map();
  for (const [index, fold] of FOLDS.entries()) {
    for (const [locale, folds] of Object.entries(foldsByLocale)) {
      if (folds.nav === null) throw new Error(`${locale}: the header does not fit even with the nav folded`);
      if (fold.from === "long" && folds.long !== null && folds.long <= folds.nav) continue;
      const media = fold.media(folds[fold.from]);
      const key = `${index} ${media}`;
      groups.set(key, { fold, media, locales: [...(groups.get(key)?.locales ?? []), locale] });
    }
  }
  const blocks = [...groups.values()].map(({ fold, media, locales }) => {
    const scope = `:is(${locales.map((locale) => `html[lang="${locale}"]`).join(", ")}) .lab-paper`;
    const rules = fold.rules.map((rule) => `  ${rule.split(", ").map((selector) => `${scope} ${selector}`).join(", ")}`);
    return `@media ${media} {\n${rules.join("\n")}\n}`;
  });
  const table = Object.entries(foldsByLocale).map(([locale, { long, about, nav }]) => ` * ${locale.padEnd(6)} long ${String(long ?? "never").padEnd(6)} about ${String(about ?? "never").padEnd(6)} nav ${nav}`);
  return [
    "/* Generated by `npm run lab:header-fit -- --write` (scripts/lab/header-fit.mjs); do not edit by hand.",
    " * The viewport width from which each locale's header shows Play's long label, the About link, and the nav with the",
    " * language picker. Below the nav width they fold into the menu, where the long label returns above phone widths.",
    ...table,
    " */",
    ...blocks,
    "",
  ].join("\n");
}

async function runAll(args, runs) {
  const named = runs.map(({ persona, ...testCase }) => ({ name: `${persona}-${testCase.locale}${testCase.write ? "-parts" : ""}`, persona, testCase }));
  const pooled = await runPersonaPool(named, { args, script: import.meta.url, caseEnv: CASE_ENV, concurrency: CONCURRENCY });
  return pooled.map(({ name, persona, testCase, run }) => ({
    persona,
    ...testCase,
    run,
    measured: run.ok ? JSON.parse(readFileSync(join(args.out, name, RESULT_FILE), "utf8")) : null,
  }));
}

async function write(args, locales) {
  const outcomes = await runAll(args, locales.map((locale) => ({ persona: "threeDays", locale, write: true })));
  const failed = outcomes.filter(({ measured }) => !measured);
  if (failed.length > 0) throw new Error(failed.map(({ locale, run }) => `${locale}: ${run.log}`).join("\n"));
  const folds = Object.fromEntries(outcomes.map(({ locale, measured }) => [locale, foldsOf(measured)]));
  writeFileSync(FIT_CSS, fitCss(folds));
  console.log(`wrote ${FIT_CSS}`);
}

async function checkAll(args, locales) {
  const outcomes = await runAll(args, PERSONAS.flatMap(({ name, streak }) => locales.map((locale) => ({ persona: name, locale, streak }))));
  const table = {};
  const failing = [];
  for (const { persona, locale, run, measured } of outcomes) {
    if (!measured) {
      failing.push(`${persona} ${locale}: run failed: ${run.log}`);
      continue;
    }
    for (const [path, byWidth] of Object.entries(measured)) {
      for (const [width, cell] of Object.entries(byWidth)) {
        table[persona] ??= {};
        table[persona][path] ??= {};
        table[persona][path][width] ??= {};
        table[persona][path][width][locale] = cell;
        if (cell.failures.length > 0) failing.push(`${persona} ${path} ${width} ${locale}: ${cell.failures.join(", ")}`);
      }
    }
  }
  writeFileSync(join(args.out, "table.json"), JSON.stringify(table, null, 2));
  for (const [persona, byPath] of Object.entries(table)) {
    console.log(`\n${persona}: locales whose header overflows, by page and width, as count(worst px)`);
    console.log(["page", ...WIDTHS].join("\t"));
    for (const [path, byWidth] of Object.entries(byPath)) {
      const cells = WIDTHS.map((width) => {
        const bad = Object.values(byWidth[width] ?? {}).filter((cell) => cell.failures.length > 0);
        return bad.length === 0 ? "ok" : `${bad.length}(${Math.max(...bad.map((cell) => Math.max(cell.scroll, cell.past)))})`;
      });
      console.log([path, ...cells].join("\t"));
    }
  }
  console.log(failing.length === 0 ? "\nPASS every locale fits" : `\nFAIL ${failing.length} cells:\n  ${failing.join("\n  ")}`);
  return failing.length === 0;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = argsOf(argv, ".lab-header-fit", "http://localhost:4531");
  const locales = LOCALES.filter((locale) => !args.only || locale === args.only);
  if (argv.includes("--write")) {
    if (args.only) throw new Error("--write measures every locale; drop --only");
    await write(args, locales);
    return;
  }
  process.exit((await checkAll(args, locales)) ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
