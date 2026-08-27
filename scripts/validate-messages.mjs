#!/usr/bin/env node
/**
 * Structural check on the message catalogues.
 *
 * Translation drift is silent: a missing key renders the raw key path in
 * production, and a dropped ICU placeholder renders literal text like
 * "Games played: {count}". Neither fails a build, so this runs as its own gate
 * for every locale on every translation pass.
 *
 * Usage: node scripts/validate-messages.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { IntlMessageFormat } from "intl-messageformat";

/**
 * The locale list is read from src/i18n/routing.ts rather than duplicated
 * here. A hardcoded copy silently drifts -- an earlier version of this script
 * kept validating ten locales long after the app shipped twenty-four, and
 * reported success the whole time.
 */
function readLocalesFromRouting() {
  const source = readFileSync(
    new URL("../src/i18n/routing.ts", import.meta.url),
    "utf8",
  );
  const block = source.match(/export const LOCALES = \[([\s\S]*?)\] as const;/);
  if (!block) {
    throw new Error("Could not find LOCALES in src/i18n/routing.ts");
  }
  return [...block[1].matchAll(/"([\w-]+)"/g)].map((m) => m[1]);
}

const LOCALES = readLocalesFromRouting();
const DEFAULT_LOCALE = "en";

// A catalogue with no locale, or a locale with no catalogue, is a broken build
// either way -- both directions are checked before anything else runs.
const catalogueFiles = readdirSync(new URL("../messages/", import.meta.url))
  .filter((name) => name.endsWith(".json"))
  .map((name) => name.replace(/\.json$/, ""));

const orphanFiles = catalogueFiles.filter((l) => !LOCALES.includes(l));
const missingFiles = LOCALES.filter((l) => !catalogueFiles.includes(l));

if (orphanFiles.length || missingFiles.length) {
  if (missingFiles.length) {
    console.error(`No catalogue for declared locale(s): ${missingFiles.join(", ")}`);
  }
  if (orphanFiles.length) {
    console.error(`Catalogue with no declared locale: ${orphanFiles.join(", ")}`);
  }
  process.exit(1);
}

/** Strings that must survive translation verbatim. */
const PROTECTED_TERMS = ["Memory Chess"];

function flatten(value, prefix = "", out = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${prefix}[${i}]`, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out[prefix] = value;
  }
  return out;
}

/** ICU arguments ({count}) and rich-text tags (<link>). */
function placeholders(text) {
  const found = new Set();
  for (const m of String(text).matchAll(/\{(\w+)[,}]|<(\w+)>/g)) {
    found.add(m[1] ?? m[2]);
  }
  return [...found].sort();
}

const catalogues = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")),
  ]),
);

const base = flatten(catalogues[DEFAULT_LOCALE]);
const problems = [];

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;
  const current = flatten(catalogues[locale]);

  for (const key of Object.keys(base)) {
    if (!(key in current)) problems.push(`[${locale}] missing key: ${key}`);
  }
  for (const key of Object.keys(current)) {
    if (!(key in base)) problems.push(`[${locale}] unknown key: ${key}`);
  }

  for (const key of Object.keys(base)) {
    if (!(key in current)) continue;

    const expected = placeholders(base[key]).join(",");
    const actual = placeholders(current[key]).join(",");
    if (expected !== actual) {
      problems.push(
        `[${locale}] placeholder mismatch at ${key}: expected {${expected}} got {${actual}}`,
      );
    }

    for (const term of PROTECTED_TERMS) {
      if (String(base[key]).includes(term) && !String(current[key]).includes(term)) {
        problems.push(`[${locale}] lost protected term "${term}" at ${key}`);
      }
    }
  }
}

/**
 * Compile every message in every locale.
 *
 * Catches malformed ICU (an unbalanced brace, a mistyped `plural`) which
 * otherwise only surfaces as a runtime throw on the page that uses it. Also
 * catches plural messages whose categories do not cover the locale: Russian
 * needs one/few/many, Turkish and Chinese need only `other`, and a message
 * translated by pattern-matching English one/other silently renders the wrong
 * form for most numbers.
 */
const PLURAL_PROBE_COUNTS = [0, 1, 2, 5, 21];

for (const locale of LOCALES) {
  const flat = flatten(catalogues[locale]);

  for (const [key, message] of Object.entries(flat)) {
    if (typeof message !== "string") continue;

    // `{name}` arguments take values; `<tag>` rich-text markers must be
    // functions, so they are probed separately.
    const argNames = [...message.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]);
    const tagNames = [...message.matchAll(/<(\w+)>/g)].map((m) => m[1]);

    const args = {
      ...Object.fromEntries(
        argNames.map((name) => [name, name === "count" ? 1 : "x"]),
      ),
      ...Object.fromEntries(tagNames.map((name) => [name, (chunks) => chunks])),
    };

    try {
      const formatter = new IntlMessageFormat(message, locale);

      if (/\{\s*\w+\s*,\s*plural/.test(message)) {
        for (const count of PLURAL_PROBE_COUNTS) {
          formatter.format({ ...args, count });
        }

        // Formatting alone will not catch a missing category: ICU silently
        // falls back to `other`, so a Russian message written with only
        // English's one/other renders "5 звезды" instead of "5 звёзд" and
        // never throws. Compare the declared categories against CLDR.
        const body = message.slice(message.indexOf("plural"));
        const declared = new Set(
          [...body.matchAll(/(?:^|[\s}])(zero|one|two|few|many|other)\s*\{/g)].map(
            (m) => m[1],
          ),
        );
        const required = new Intl.PluralRules(locale, { type: "cardinal" })
          .resolvedOptions().pluralCategories;
        const missing = required.filter((category) => !declared.has(category));

        if (missing.length > 0) {
          problems.push(
            `[${locale}] plural at ${key} is missing ${missing.join(", ")} ` +
              `(${locale} needs ${required.join(", ")})`,
          );
        }
      } else {
        formatter.format(args);
      }
    } catch (error) {
      problems.push(`[${locale}] ICU error at ${key}: ${error.message}`);
    }
  }
}

const keyCount = Object.keys(base).length;

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) across ${LOCALES.length} locales.`);
  process.exit(1);
}

console.log(`${keyCount} keys x ${LOCALES.length} locales - all consistent.`);
