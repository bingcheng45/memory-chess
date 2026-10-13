#!/usr/bin/env node
/**
 * Checks a translation of the Brain Lab's copy (`home.lab` in messages/en.json)
 * and writes it into one locale's catalogue. A translator, a reviewer and the
 * integrator all run it. The string rules are the articles' chrome rules
 * (scripts/articles-i18n/checks.mjs): ICU placeholders, tags and plural forms,
 * every number kept, no long dash, no English left in, the locale's script
 * and language. This adds the lab's own: the same leaves as English, and the
 * names of players, places and researchers kept letter for letter.
 *
 * A translation is a directory of JSON files. Each holds part of the
 * `home.lab` tree, split as the translator likes, and no leaf may be in two
 * files. `same-as-english.json`, when present, lists the paths whose value is
 * right when identical to English.
 *
 * Usage, from the repo root:
 *   node scripts/lab-i18n.mjs check <locale> <dir>
 *   node scripts/lab-i18n.mjs import <locale> <dir>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { leafProblems } from "./articles-i18n/checks.mjs";
import { textOf } from "./articles-i18n/icu.mjs";
import { languageFailures, missingLanguageRuleProblems } from "./articles-i18n/language.mjs";
import { inOrderOf, leavesOf } from "./articles-i18n/leaves.mjs";
import { CHROME, ENGLISH } from "./articles-i18n/names.mjs";

const SAME_AS_ENGLISH_FILE = "same-as-english.json";
const PROTECTED_NAMES = ["Topalov", "Shirov", "Kasparov", "Linares", "Wijk aan Zee", "de Groot", "Chase", "Simon", "Gobet", "Safari", "iPhone", "iPad"];
const USAGE = "Usage: node scripts/lab-i18n.mjs check|import <locale> <dir>";

const messagesFile = (locale) => join("messages", `${locale}.json`);
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const toJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

function readTranslation(dir) {
  const problems = [];
  const leaves = new Map();
  let sameAsEnglish = [];

  for (const name of readdirSync(dir).filter((file) => file.endsWith(".json")).sort()) {
    let value;
    try {
      value = readJson(join(dir, name));
    } catch (error) {
      problems.push(`${name}: not valid JSON, ${error.message}`);
      continue;
    }
    if (name === SAME_AS_ENGLISH_FILE) {
      sameAsEnglish = Array.isArray(value) ? value : [];
      if (!Array.isArray(value)) problems.push(`${name}: must be a list of paths`);
      continue;
    }
    for (const [path, leaf] of leavesOf(value)) {
      if (leaves.has(path)) problems.push(`${name} ${path}: also in another file`);
      leaves.set(path, leaf);
    }
  }
  return { problems, leaves, sameAsEnglish };
}

function nameProblems(english, value) {
  return PROTECTED_NAMES.filter((name) => english.includes(name) && !value.includes(name)).map((name) => `the name "${name}" must stay as in the English text`);
}

function failuresOf(locale, english, { problems, leaves, sameAsEnglish }) {
  const englishLeaves = new Map(leavesOf(english));
  const shape = [
    ...[...englishLeaves.keys()].filter((path) => typeof leaves.get(path) !== "string" || leaves.get(path).trim() === "").map((path) => `${path}: missing`),
    ...[...leaves.keys()].filter((path) => !englishLeaves.has(path)).map((path) => `${path}: the English text has no such path`),
    ...sameAsEnglish.filter((path) => leaves.get(path) !== englishLeaves.get(path)).map((path) => `${path}: listed in ${SAME_AS_ENGLISH_FILE} but differs from the English text`),
  ];
  const present = [...englishLeaves].filter(([path]) => typeof leaves.get(path) === "string");
  const strings = present.flatMap(([path, englishLeaf]) => {
    const value = leaves.get(path);
    const leaf = { locale, kind: CHROME, path, english: englishLeaf, value, isListed: sameAsEnglish.includes(path) };
    return [...leafProblems(leaf), ...nameProblems(englishLeaf, value)].map((reason) => `${path}: ${reason}`);
  });
  const prose = present.map(([path]) => [path, textOf(CHROME, leaves.get(path), locale)]);

  return [...missingLanguageRuleProblems(locale), ...problems, ...shape, ...strings, ...languageFailures(locale, "home.lab", prose)];
}

/** The catalogue with `home.lab` set to `lab`, in English key order and in English's place within `home`. */
function catalogueWith(locale, englishHome, lab) {
  const catalogue = readJson(messagesFile(locale));
  if (toJson(catalogue) !== readFileSync(messagesFile(locale), "utf8")) {
    throw new Error(`${messagesFile(locale)} is not formatted as JSON.stringify(value, null, 2), so a write would touch lines outside home.lab`);
  }
  const home = Object.fromEntries(
    Object.keys(englishHome)
      .filter((key) => key === "lab" || key in catalogue.home)
      .map((key) => [key, key === "lab" ? lab : catalogue.home[key]]),
  );
  return { ...catalogue, home: { ...catalogue.home, ...home } };
}

function run([command, locale, dir]) {
  const locales = readdirSync("messages").map((file) => file.replace(/\.json$/, ""));
  if (!["check", "import"].includes(command) || !dir || locale === ENGLISH || !locales.includes(locale)) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const englishHome = readJson(messagesFile(ENGLISH)).home;
  const translation = readTranslation(dir);
  const failures = failuresOf(locale, englishHome.lab, translation);
  failures.forEach((failure) => process.stderr.write(`${failure.replace(/\s*\n\s*/g, " ")}\n`));
  if (failures.length > 0) {
    process.stdout.write(`failed ${command} ${locale}: ${failures.length} problem(s)\n`);
    return 1;
  }
  if (command === "import") {
    const lab = inOrderOf(englishHome.lab, Object.fromEntries(translation.leaves));
    writeFileSync(messagesFile(locale), toJson(catalogueWith(locale, englishHome, lab)));
  }
  process.stdout.write(`ok ${command} ${locale}: ${translation.leaves.size} strings\n`);
  return 0;
}

process.exitCode = run(process.argv.slice(2));
