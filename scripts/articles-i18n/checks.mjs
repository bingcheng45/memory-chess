import { formatError, literalTextOf, partsOf } from "./icu.mjs";
import { leavesOf } from "./leaves.mjs";
import { CHROME, ENGLISH } from "./names.mjs";

const ARTICLE = "article";
const PROTECTED_TERM = "Memory Chess";
const TITLE_PATH = "title";
const TITLE_MAX_GRAPHEMES = 90;
const LICENSE_PATH = "photo.license";
const CC_LICENSE_PREFIX = "CC ";
const SOURCE_TITLE = /^sources\[\d+\]\.title$/;
const MAY_EQUAL_ENGLISH = /^(person\.name|photo\.author|photo\.license|sources\[\d+\]\.title)$/;
const LETTER = /\p{L}/gu;
const HAS_LETTER = /\p{L}/u;
const LONG_DASH = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const ANGLE_BRACKET = /[<>]/;
const IDEOGRAPHIC_FULL_STOP = String.fromCodePoint(0x3002);
const DANDA = String.fromCodePoint(0x964);
const FULL_STOPS = [".", IDEOGRAPHIC_FULL_STOP, DANDA];
const ENDS_WITHOUT_PUNCTUATION = /[\p{L}\p{N})]$/u;

const DECIMAL_DIGIT = /\p{Nd}/u;
const EVERY_DECIMAL_DIGIT = /\p{Nd}/gu;
const DIGITS_PER_SET = 10;
const NO_BREAK_SPACES = String.fromCharCode(0xa0, 0x202f);
const GROUP_SEPARATOR = new RegExp(`(?<=\\d)[.,' ${NO_BREAK_SPACES}](?=\\d{3}(?!\\d))`, "g");

const MIN_LETTERS_FOR_SCRIPT_CHECK = 40;
const THIS_FILE = "scripts/articles-i18n/checks.mjs";
const LATIN = "Latn";
// From the script a locale is written in, as `Intl.Locale` names it, to the
// Unicode scripts its letters may come from.
const SCRIPTS = {
  Cyrl: ["Cyrillic"],
  Deva: ["Devanagari"],
  Jpan: ["Hiragana", "Katakana", "Han"],
  Kore: ["Hangul"],
  Hans: ["Han"],
  Hant: ["Han"],
};

const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];

/** `3 failures`, `1 failure`. */
export const counted = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// Unicode lays every set of decimal digits out as ten code points from zero
// to nine, so the distance to the start of the run of digits gives the value.
function asciiDigit(digit) {
  const code = digit.codePointAt(0);
  let zero = code;
  while (DECIMAL_DIGIT.test(String.fromCodePoint(zero - 1))) zero -= 1;
  return String((code - zero) % DIGITS_PER_SET);
}

function digitRuns(text) {
  return text.replace(EVERY_DECIMAL_DIGIT, asciiDigit).replace(GROUP_SEPARATOR, "").match(/\d+/g) ?? [];
}

/**
 * The numbers of `english` that `translated` does not carry, compared as
 * multisets of digit runs. `50,000`, `50.000` and `50 000` are one number, and
 * a digit of any script counts as its ASCII value.
 *
 * @param {string} english
 * @param {string} translated
 * @returns {string[]}
 */
export function numberProblems(english, translated) {
  const wanted = digitRuns(english);
  const found = digitRuns(translated);
  const timesIn = (runs, run) => runs.filter((other) => other === run).length;

  return [...new Set(wanted)].flatMap((run) => {
    const here = timesIn(found, run);
    if (here >= timesIn(wanted, run)) return [];
    if (here === 0) return [`the number ${run} of the English text is missing`];
    return [`the number ${run} is in the English text ${counted(timesIn(wanted, run), "time")} and here ${counted(here, "time")}`];
  });
}

function namesProblems(label, open, close, wanted, found) {
  const shown = (names) => (names.length === 0 ? "none" : names.map((name) => `${open}${name}${close}`).join(", "));
  return wanted.join() === found.join() ? [] : [`${label} are ${shown(found)}, the English text has ${shown(wanted)}`];
}

function missingCategoryProblems(locale, { name, type, categories }) {
  const inLocale = new Intl.PluralRules(locale, { type }).resolvedOptions().pluralCategories;
  const required = PLURAL_CATEGORIES.filter((category) => inLocale.includes(category));
  const missing = required.filter((category) => !categories.includes(category));
  if (missing.length === 0) return [];
  return [`plural {${name}} is missing ${missing.join(", ")} (${locale} needs ${required.join(", ")})`];
}

function pluralProblems(locale, english, translated) {
  return [...new Set(english.plurals.map((plural) => plural.name))].flatMap((name) => {
    const plurals = translated.plurals.filter((plural) => plural.name === name);
    if (plurals.length === 0) return [`{${name}} must stay a plural`];
    return plurals.flatMap((plural) => missingCategoryProblems(locale, plural));
  });
}

function icuProblems({ kind, locale, english, value }) {
  if (kind !== CHROME) return [];
  const source = partsOf(english, ENGLISH);
  const parts = partsOf(value, locale);
  if (parts.error !== undefined) return [`ICU error, ${parts.error}`];
  const error = formatError(value, locale, parts);

  return [
    ...namesProblems("placeholders", "{", "}", source.placeholders, parts.placeholders),
    ...namesProblems("tags", "<", ">", source.tags, parts.tags),
    ...pluralProblems(locale, source, parts),
    ...(error === undefined ? [] : [`ICU error, ${error}`]),
  ];
}

function identicalProblems({ kind, path, english, value, isListed }) {
  if (value !== english || isListed || !HAS_LETTER.test(value)) return [];
  if (kind === ARTICLE && MAY_EQUAL_ENGLISH.test(path)) return [];
  return ["identical to the English text, list the path in sameAsEnglish if that is right"];
}

function verbatimProblems({ kind, path, english, value }) {
  if (kind !== ARTICLE || value === english) return [];
  if (SOURCE_TITLE.test(path)) return ["a source title must stay exactly as in the English text"];
  if (path === LICENSE_PATH && english.startsWith(CC_LICENSE_PREFIX)) {
    return ["a CC licence must stay exactly as in the English text"];
  }
  return [];
}

function titleLengthProblems({ kind, path, locale, value }) {
  if (kind !== ARTICLE || path !== TITLE_PATH) return [];
  const length = [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value)].length;
  return length <= TITLE_MAX_GRAPHEMES ? [] : [`${length} characters, the limit is ${TITLE_MAX_GRAPHEMES}`];
}

const scriptOf = (locale) => new Intl.Locale(locale).maximize().script;

// Without this line a new locale in a script the table lacks would skip the
// script check in silence.
function missingScriptRuleProblems(locale) {
  const script = scriptOf(locale);
  if (script === LATIN || Object.hasOwn(SCRIPTS, script)) return [];
  return [`${locale}: no script rule for ${script}, add one to ${THIS_FILE}`];
}

// A leaf that equals its English leaf is the identical check's business. It
// cannot be in the locale's script, and it passes there only on purpose.
function scriptProblems({ kind, locale, english, value }) {
  const scripts = SCRIPTS[scriptOf(locale)];
  if (scripts === undefined || value === english) return [];
  const letters = (kind === CHROME ? literalTextOf(value, locale) : value).match(LETTER) ?? [];
  if (letters.length < MIN_LETTERS_FOR_SCRIPT_CHECK) return [];
  const inScript = new RegExp(scripts.map((script) => `\\p{Script_Extensions=${script}}`).join("|"), "u");
  const expected = letters.filter((letter) => inScript.test(letter)).length;
  if (expected * 2 >= letters.length) return [];
  return [`${expected} of ${letters.length} letters are ${scripts.join(" or ")}, at least half must be`];
}

// The page ends some leaves itself: the photo credit prints `{changes}.`, so a
// translated leaf with its own full stop would print two. An English leaf that
// ends on a quotation mark is a sentence, and each language has its own rule
// for which side of the mark the full stop goes.
function fullStopProblems({ english, value }) {
  if (!ENDS_WITHOUT_PUNCTUATION.test(english) || !FULL_STOPS.some((stop) => value.endsWith(stop))) return [];
  return ["ends with a full stop, the English text does not"];
}

const LEAF_RULES = [
  icuProblems,
  ({ english, value }) => numberProblems(english, value),
  identicalProblems,
  verbatimProblems,
  ({ value }) => (LONG_DASH.test(value) ? ["has an em dash or an en dash"] : []),
  titleLengthProblems,
  ({ english, value }) =>
    english.includes(PROTECTED_TERM) && !value.includes(PROTECTED_TERM) ? [`"${PROTECTED_TERM}" is missing`] : [],
  ({ kind, value }) => (kind === ARTICLE && ANGLE_BRACKET.test(value) ? ["has < or >"] : []),
  scriptProblems,
  fullStopProblems,
];

/**
 * Every rule one translated string breaks, as reasons without the path.
 *
 * @param {{
 *   locale: string,
 *   kind: "article" | "chrome",
 *   path: string,
 *   english: string,
 *   value: string,
 *   isListed: boolean,
 * }} leaf `isListed` says the translator listed the path as kept in English on purpose.
 * @returns {string[]}
 */
export function leafProblems(leaf) {
  return LEAF_RULES.flatMap((rule) => rule(leaf));
}

const isPathList = (value) => Array.isArray(value) && value.every((path) => typeof path === "string");

function leafFailures({ locale, kind, name, english, unit }, listed) {
  const translated = new Map(leavesOf(unit.text));

  return leavesOf(english).flatMap(([path, englishLeaf]) => {
    const value = translated.get(path);
    if (typeof value !== "string" || value.trim() === "") return [];
    const leaf = { locale, kind, path, english: englishLeaf, value, isListed: listed.includes(path) };
    return leafProblems(leaf).map((reason) => `${name} ${path}: ${reason}`);
  });
}

function listedFailures({ name, english, unit }, listed) {
  const englishLeaves = new Map(leavesOf(english));
  const translated = new Map(leavesOf(unit.text));

  return listed.flatMap((path) => {
    if (!englishLeaves.has(path)) return [`${name} ${path}: listed in sameAsEnglish but the English text has no such path`];
    if (translated.get(path) === englishLeaves.get(path)) return [];
    return [`${name} ${path}: listed in sameAsEnglish but differs from the English text`];
  });
}

function unitFailures(subject, isInstalled, shapeProblems) {
  const { name, english, sourceHash, unit } = subject;
  if (unit === undefined) return [`${name}: no file`];
  if (unit.error !== undefined) return [`${name}: ${unit.error}`];
  const isStale = isInstalled && unit.sourceHash !== sourceHash;
  const listed = isPathList(unit.sameAsEnglish) ? unit.sameAsEnglish : [];

  return [
    ...(isStale ? [`${name}: sourceHash is stale, the English text changed after this translation was made`] : []),
    ...(isPathList(unit.sameAsEnglish) ? [] : [`${name}: sameAsEnglish is not a list of paths`]),
    ...shapeProblems(english, unit.text).map((problem) => `${name} ${problem}`),
    ...leafFailures(subject, listed),
    ...listedFailures(subject, listed),
  ];
}

/**
 * Every reason the translation in `bundle` may not be installed or published,
 * one line each, naming the article or `chrome`, the leaf path and the reason.
 *
 * `source` is the English side: `{ lib: { shapeProblems }, articles: [{ slug,
 * text, sourceHash }], chrome: { strings, sourceHash } }`, with `shapeProblems`
 * from `src/lib/articles/articleText.ts`. `bundle` is one locale read from a
 * translator's directory or from the installed files: `{ installed, problems,
 * sameAsEnglishKeys, articles: { [slug]: unit }, chrome: unit }`, where a unit
 * is `{ text, sameAsEnglish, sourceHash, reviewed }` or `{ error }`.
 *
 * @param {string} locale
 * @returns {string[]}
 */
export function failuresOf(locale, source, bundle) {
  const slugs = source.articles.map((article) => article.slug);
  const failuresFor = (subject) => unitFailures({ locale, ...subject }, bundle.installed, source.lib.shapeProblems);
  const isUnknown = (name) => !slugs.includes(name);

  return [
    ...missingScriptRuleProblems(locale),
    ...bundle.problems,
    ...bundle.sameAsEnglishKeys
      .filter((key) => key !== CHROME && isUnknown(key))
      .map((key) => `same-as-english.json: "${key}" is neither chrome nor an article`),
    ...source.articles.flatMap(({ slug, text, sourceHash }) =>
      failuresFor({ kind: ARTICLE, name: slug, english: text, sourceHash, unit: bundle.articles[slug] }),
    ),
    ...Object.keys(bundle.articles)
      .filter(isUnknown)
      .map((name) => `${name}: no English article has this slug`),
    ...failuresFor({
      kind: CHROME,
      name: CHROME,
      english: source.chrome.strings,
      sourceHash: source.chrome.sourceHash,
      unit: bundle.chrome,
    }),
  ];
}

/** One line for each installed file of `bundle` that no reviewer has approved. */
export function unreviewedOf(bundle) {
  return [...Object.entries(bundle.articles), [CHROME, bundle.chrome]]
    .filter(([, unit]) => unit !== undefined && unit.error === undefined && unit.reviewed !== true)
    .map(([name]) => `${name}: not reviewed`);
}
