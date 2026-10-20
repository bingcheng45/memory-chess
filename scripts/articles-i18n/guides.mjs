import { existsSync, readFileSync, realpathSync } from "node:fs";
import { counted } from "./checks.mjs";
import { leavesOf } from "./leaves.mjs";
import { CHROME, ENGLISH } from "./names.mjs";
import { UsageError, importTypeScript, inside, muteTypelessPackageWarning, shippedLocales } from "./repo.mjs";
import { unitCommands } from "./units.mjs";

const LEARN_DIR = "src/lib/seo/learn";
const TRANSLATED_GUIDES_FILE = `${LEARN_DIR}/translatedGuides.ts`;
const GUIDE_BODY_PATH = /^(meta\.description|intro\.(quickAnswer|takeaways\[\d+\])|sections\..+\.blocks\[\d+\]\.(paragraphs|items)\[\d+\]|end\[\d+\]\.items\[\d+\]\.answer)$/;

/** Game buttons a guide may name, by their key under `game.result` or `game.round`. A one-word label counts only after "press". */
const BUTTONS = {
  result: ["tryAgain", "nextRound", "changeSettings", "moreOptions", "submitToLeaderboard", "viewLeaderboard"],
  round: ["start", "hide", "restart", "again", "submit", "clear"],
};

function buttonsOf(messages) {
  return Object.entries(BUTTONS).flatMap(([group, keys]) => keys.map((key) => ({ key: `game.${group}.${key}`, label: messages.game[group][key] })));
}

const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isNamed(english, label) {
  const pattern = label.includes(" ") ? `\\b${escaped(label)}\\b` : `\\bpress(?:es|ing|ed)?\\s+${escaped(label)}\\b`;
  return new RegExp(pattern, "i").test(english) && english.includes(label);
}

/**
 * A guide leaf that names a game button in English must name the same button as the game shows it in `locale`, so
 * a reader looking for "Try again" finds it under its translated name. The labels come from `messages/<locale>.json`.
 */
export function buttonFailures(englishButtons, localeButtons, name, englishText, translatedText) {
  const translated = new Map(leavesOf(translatedText));
  return leavesOf(englishText).flatMap(([path, english]) => {
    const value = translated.get(path);
    if (typeof english !== "string" || typeof value !== "string") return [];
    return englishButtons
      .filter(({ label }) => isNamed(english, label))
      .map(({ key }) => localeButtons.find((button) => button.key === key))
      .filter((button) => !value.includes(button.label))
      .map((button) => `${name} ${path}: names the button ${button.key}, which the game shows as "${button.label}" here`);
  });
}

const readMessages = (root, locale) => JSON.parse(readFileSync(inside(root, `messages/${locale}.json`), "utf8"));

/**
 * The English side of the translated guides: one unit per guide in `TRANSLATED_GUIDE_SLUGS` and one for the chrome,
 * each with the hash of its text, and the locales that serve them. The same shape as `loadPagesRepo`.
 */
export async function loadGuidesRepo(cwd) {
  if (!process.features.typescript) {
    throw new UsageError("this needs a Node that strips TypeScript types, 22.18 or newer");
  }
  const root = realpathSync(cwd);
  if (!existsSync(inside(root, TRANSLATED_GUIDES_FILE))) {
    throw new UsageError(`${TRANSLATED_GUIDES_FILE} is missing, run this from the repo root`);
  }
  muteTypelessPackageWarning();
  const lib = await importTypeScript(root, "src/lib/articles/articleText.ts");
  const { textOf } = await importTypeScript(root, `${LEARN_DIR}/guideText.ts`);
  const { default: chrome } = await importTypeScript(root, `${LEARN_DIR}/guideChrome.ts`);
  const { TRANSLATED_GUIDE_SLUGS, TRANSLATED_GUIDE_LOCALES, approvalNameOf } = await importTypeScript(root, TRANSLATED_GUIDES_FILE);
  const guides = await Promise.all(TRANSLATED_GUIDE_SLUGS.map((slug) => importTypeScript(root, `${LEARN_DIR}/guides/${slug}.ts`)));
  const texts = [...guides.map(({ default: doc }) => textOf(doc)), chrome];
  const names = [...TRANSLATED_GUIDE_SLUGS, CHROME];

  return {
    root,
    locales: shippedLocales(root),
    translatedLocales: TRANSLATED_GUIDE_LOCALES,
    lib,
    approvalNameOf,
    units: texts.map((text, index) => ({ name: names[index], text, sourceHash: lib.sourceHashOf(text) })),
  };
}

const LIMITS = { "meta.title": 60, "meta.description": 160 };

function lengthFailures(locale, name, text) {
  const leaves = new Map(leavesOf(text));
  return Object.entries(LIMITS).flatMap(([path, limit]) => {
    const value = leaves.get(path);
    if (typeof value !== "string") return [];
    const length = [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value)].length;
    return length <= limit ? [] : [`${name} ${path}: ${length} characters, the limit is ${limit}`];
  });
}

function guideFailures(repo, locale, bundle) {
  const englishButtons = buttonsOf(readMessages(repo.root, ENGLISH));
  const localeButtons = buttonsOf(readMessages(repo.root, locale));
  return repo.units
    .filter(({ name }) => name !== CHROME && bundle.units[name]?.text !== undefined)
    .flatMap(({ name, text }) => [
      ...buttonFailures(englishButtons, localeButtons, name, text, bundle.units[name].text),
      ...lengthFailures(locale, name, bundle.units[name].text),
    ]);
}

export const GUIDE_COMMANDS = unitCommands({
  translationsDir: `${LEARN_DIR}/translations`,
  flag: "--guides",
  served: "the guides",
  size: (repo) => `${counted(repo.units.length - 1, "guide")} and the chrome`,
  isBody: (path) => GUIDE_BODY_PATH.test(path),
  extraFailures: guideFailures,
});
