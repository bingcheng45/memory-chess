import { existsSync, readFileSync, realpathSync } from "node:fs";
import { counted, pageUnreviewedOf } from "./checks.mjs";
import { leavesOf } from "./leaves.mjs";
import { CHROME, ENGLISH } from "./names.mjs";
import { UsageError, importTypeScript, inside, muteTypelessPackageWarning, shippedLocales, toJson, writeChanged } from "./repo.mjs";
import { unitCommands } from "./units.mjs";

const LEARN_DIR = "src/lib/seo/learn";
const TRANSLATED_GUIDES_FILE = `${LEARN_DIR}/translatedGuides.ts`;
const GUIDE_BODY_PATH = /^(meta\.description|intro\.(quickAnswer|takeaways\[\d+\])|sections\..+\.blocks\[\d+\]\.(paragraphs|items)\[\d+\]|end\[\d+\]\.items\[\d+\]\.answer)$/;

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
  const { TRANSLATED_GUIDE_SLUGS, TRANSLATED_GUIDE_LOCALES, SERVED_GUIDES_FILE, approvalNameOf } = await importTypeScript(
    root,
    TRANSLATED_GUIDES_FILE,
  );
  const guides = await Promise.all(TRANSLATED_GUIDE_SLUGS.map((slug) => importTypeScript(root, `${LEARN_DIR}/guides/${slug}.ts`)));
  const texts = [...guides.map(({ default: doc }) => textOf(doc)), chrome];
  const names = [...TRANSLATED_GUIDE_SLUGS, CHROME];

  return {
    root,
    locales: shippedLocales(root),
    translatedLocales: TRANSLATED_GUIDE_LOCALES,
    servedFile: SERVED_GUIDES_FILE,
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

const WITHHELD_BECAUSE = {
  source: "the English text changed after this translation was approved",
  chrome: "the guide chrome every guide shares changed after this translation was approved",
  button: "a button the guide names has a new label in the game",
};

/**
 * The guides of `locale` that are approved but no longer current, each with the reason. Each one is withheld: it
 * redirects to the English guide until a new translation is imported and approved. A stale chrome withholds every
 * guide, since each page draws its labels from it.
 */
function withheldOf(repo, locale, bundle) {
  const isStale = ({ name, sourceHash }) => {
    const unit = bundle.units[name];
    return unit !== undefined && unit.error === undefined && unit.sourceHash !== sourceHash;
  };
  const englishButtons = buttonsOf(readMessages(repo.root, ENGLISH));
  const localeButtons = buttonsOf(readMessages(repo.root, locale));
  const isChromeStale = isStale(repo.units.find(({ name }) => name === CHROME));
  const reasonOf = (unit) => {
    if (isChromeStale) return WITHHELD_BECAUSE.chrome;
    if (isStale(unit)) return WITHHELD_BECAUSE.source;
    const translated = bundle.units[unit.name]?.text;
    if (translated === undefined) return undefined;
    const [button] = buttonFailures(englishButtons, localeButtons, unit.name, unit.text, translated);
    return button === undefined ? undefined : `${WITHHELD_BECAUSE.button} (${button})`;
  };
  const guides = repo.units.filter(({ name }) => name !== CHROME);
  const withheld = new Map(guides.flatMap((unit) => {
    const reason = reasonOf(unit);
    return reason === undefined ? [] : [[unit.name, reason]];
  }));
  return { withheld, isChromeStale };
}

const withheldWarning = (locale, name, reason) =>
  `[${locale}] ${name}: ${reason}, so /${locale}/learn/${name} answers a 307 to the English guide until it is translated again. ` +
  `Run node scripts/articles-i18n.mjs --guides export <dir>, translate, then --guides import ${locale} <dir> and --guides approve ${locale}`;

/**
 * Fails on what no reviewer approved and on a current translation that breaks a rule, withholds an approved
 * translation that is no longer current, and writes the translations left to serve to `repo.servedFile`.
 */
function verifyGuides(repo, { readInstalled, failuresOf }) {
  const locales = repo.translatedLocales.filter((locale) => locale !== ENGLISH);
  const slugs = repo.units.map(({ name }) => name).filter((name) => name !== CHROME);
  const checked = locales.map((locale) => {
    const bundle = readInstalled(repo.root, locale);
    const { withheld, isChromeStale } = withheldOf(repo, locale, bundle);
    const skipped = (name) => withheld.has(name) || (name === CHROME && isChromeStale);
    const current = {
      repo: { ...repo, units: repo.units.filter(({ name }) => !skipped(name)) },
      bundle: { ...bundle, units: Object.fromEntries(Object.entries(bundle.units).filter(([name]) => !skipped(name))) },
    };
    const failures = [
      ...failuresOf(current.repo, locale, current.bundle),
      ...pageUnreviewedOf(repo.lib, repo.approvalNameOf, locale, bundle),
    ].map((line) => `[${locale}] ${line}`);
    return { locale, withheld, failures };
  });

  const failures = checked.flatMap(({ failures }) => failures);
  if (failures.length > 0) return { failures, summary: `verify --guides: ${counted(failures.length, "failure")}` };

  const served = Object.fromEntries(slugs.map((slug) => [slug, checked.filter(({ withheld }) => !withheld.has(slug)).map(({ locale }) => locale)]));
  writeChanged(repo.root, [{ file: repo.servedFile, content: toJson(served) }]);
  const warnings = checked.flatMap(({ locale, withheld }) => [...withheld].map(([name, reason]) => withheldWarning(locale, name, reason)));
  const count = Object.values(served).flat().length;
  return {
    failures: [],
    warnings,
    summary: `ok verify --guides: ${count} of ${slugs.length * locales.length} translations served, in ${locales.join(", ")}`,
  };
}

export const GUIDE_COMMANDS = unitCommands({
  verify: verifyGuides,
  translationsDir: `${LEARN_DIR}/translations`,
  flag: "--guides",
  served: "the guides",
  size: (repo) => `${counted(repo.units.length - 1, "guide")} and the chrome`,
  isBody: (path) => GUIDE_BODY_PATH.test(path),
  extraFailures: guideFailures,
});
