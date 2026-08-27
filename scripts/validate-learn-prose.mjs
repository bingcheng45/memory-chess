#!/usr/bin/env node
/**
 * Structural check on the translated Learn prose.
 *
 * The overlay in src/lib/seo/learn/index.ts takes prose positionally: article
 * i of a locale becomes article i of the English set, drill card j becomes
 * drill card j. That makes structure impossible to break by editing the wrong
 * field -- but it also means a short array silently drops content, and a
 * misordered file silently attaches the wrong text to the wrong article.
 * Neither fails a build. This does.
 *
 * Usage: node scripts/validate-learn-prose.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";

const PROSE_DIR = new URL("../src/lib/seo/learn/prose/", import.meta.url);
const ROUTING = new URL("../src/i18n/routing.ts", import.meta.url);

function declaredTranslatedLocales() {
  const source = readFileSync(
    new URL("../src/lib/seo/learn/index.ts", import.meta.url),
    "utf8",
  );
  const block = source.match(
    /TRANSLATED_LEARN_LOCALES = new Set<Locale>\(\[([\s\S]*?)\]\)/,
  );
  if (!block) throw new Error("Could not find TRANSLATED_LEARN_LOCALES");
  return [...block[1].matchAll(/"([\w-]+)"/g)].map((m) => m[1]);
}

function knownLocales() {
  const source = readFileSync(ROUTING, "utf8");
  const block = source.match(/export const LOCALES = \[([\s\S]*?)\] as const;/);
  return [...block[1].matchAll(/"([\w-]+)"/g)].map((m) => m[1]);
}

const load = (locale) =>
  JSON.parse(readFileSync(new URL(`${locale}.json`, PROSE_DIR), "utf8"));

const english = load("en");
const problems = [];

/** Recursively compares shape: same keys, same array lengths, strings non-empty. */
function compare(expected, actual, path, locale) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      problems.push(`[${locale}] ${path}: expected an array`);
      return;
    }
    if (actual.length !== expected.length) {
      problems.push(
        `[${locale}] ${path}: ${actual.length} items, English has ${expected.length}`,
      );
      return;
    }
    expected.forEach((item, i) => compare(item, actual[i], `${path}[${i}]`, locale));
    return;
  }

  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") {
      problems.push(`[${locale}] ${path}: expected an object`);
      return;
    }
    for (const key of Object.keys(expected)) {
      if (!(key in actual)) {
        problems.push(`[${locale}] ${path}.${key}: missing`);
        continue;
      }
      compare(expected[key], actual[key], `${path}.${key}`, locale);
    }
    for (const key of Object.keys(actual)) {
      if (!(key in expected)) {
        problems.push(`[${locale}] ${path}.${key}: unknown field`);
      }
    }
    return;
  }

  if (typeof actual !== "string" || actual.trim() === "") {
    problems.push(`[${locale}] ${path}: empty or non-string`);
  }
}

const declared = declaredTranslatedLocales();
const known = new Set(knownLocales());
const files = existsSync(PROSE_DIR)
  ? readdirSync(PROSE_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .filter((l) => l !== "en")
  : [];

// A locale claiming a translation it does not have would emit hreflang for
// content that falls back to English -- the exact duplicate-content signal the
// gate exists to prevent.
for (const locale of declared) {
  if (!files.includes(locale)) {
    problems.push(
      `[${locale}] listed in TRANSLATED_LEARN_LOCALES but has no prose/${locale}.json`,
    );
  }
  if (!known.has(locale)) {
    problems.push(`[${locale}] listed as translated but is not a shipped locale`);
  }
}

for (const locale of files) {
  if (!known.has(locale)) {
    problems.push(`[${locale}] prose file exists but is not a shipped locale`);
    continue;
  }

  const translated = load(locale);
  compare(english, translated, "articles", locale);

  // Slugs are the alignment key: article i must be the same article.
  english.forEach((article, i) => {
    if (translated[i] && translated[i].slug !== article.slug) {
      problems.push(
        `[${locale}] articles[${i}].slug is "${translated[i].slug}", expected "${article.slug}" -- articles are out of order`,
      );
    }
  });

  if (!declared.includes(locale)) {
    problems.push(
      `[${locale}] has prose/${locale}.json but is not in TRANSLATED_LEARN_LOCALES, so it will never be served`,
    );
  }
}

/**
 * Script-purity check.
 *
 * A single character from the wrong script -- a CJK glyph mid-word in a Cyrillic
 * sentence, say -- is invisible in review and survives every structural check.
 * This caught exactly that during the Russian pass. Each locale declares the
 * scripts it may contain; anything outside them is flagged.
 */
const SCRIPT_RANGES = {
  cyrillic: /[\u0400-\u04FF]/,
  devanagari: /[\u0900-\u097F]/,
  cjk: /[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]/,
  hangul: /[\uAC00-\uD7AF\u1100-\u11FF]/,
  arabic: /[\u0600-\u06FF]/,
};

/** Scripts each locale is allowed to use, beyond Latin and shared punctuation. */
const ALLOWED_SCRIPTS = {
  ru: ["cyrillic"],
  hi: ["devanagari"],
  ja: ["cjk"],
  ko: ["hangul", "cjk"],
  "zh-CN": ["cjk"],
  "zh-TW": ["cjk"],
};

for (const locale of files) {
  const allowed = new Set(ALLOWED_SCRIPTS[locale] ?? []);
  const forbidden = Object.entries(SCRIPT_RANGES).filter(
    ([name]) => !allowed.has(name),
  );

  const walk = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
    } else if (typeof value === "string") {
      for (const [name, pattern] of forbidden) {
        const hit = value.match(pattern);
        if (hit) {
          problems.push(
            `[${locale}] ${path}: stray ${name} character "${hit[0]}" in "${value.slice(0, 60)}"`,
          );
          break;
        }
      }
    }
  };

  walk(load(locale), "articles");
}

if (problems.length > 0) {
  console.error(problems.slice(0, 40).join("\n"));
  if (problems.length > 40) {
    console.error(`... and ${problems.length - 40} more`);
  }
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}

const total = english.length;
console.log(
  files.length === 0
    ? `${total} English articles; no translations yet.`
    : `${total} articles x ${files.length} translated locale(s) - all aligned.`,
);
