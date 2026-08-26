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
import { readFileSync } from "node:fs";

const LOCALES = [
  "en",
  "es",
  "ru",
  "pt-BR",
  "de",
  "fr",
  "hi",
  "it",
  "zh-CN",
  "tr",
];
const DEFAULT_LOCALE = "en";

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

const keyCount = Object.keys(base).length;

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) across ${LOCALES.length} locales.`);
  process.exit(1);
}

console.log(`${keyCount} keys x ${LOCALES.length} locales - all consistent.`);
