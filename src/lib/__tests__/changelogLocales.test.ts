import fs from "node:fs";
import path from "node:path";

import { LOCALES, DEFAULT_LOCALE } from "@/i18n/routing";
import { CHANGELOG_ENTRIES, type ChangelogEntry } from "@/lib/changelog";
import { getLocalizedChangelogEntries } from "@/lib/changelog/localized";

const PROSE_DIR = path.join(process.cwd(), "src/lib/changelog/prose");
const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

type Json = string | { [key: string]: Json } | Json[];

const readProse = (locale: string): Json[] =>
  JSON.parse(
    fs.readFileSync(path.join(PROSE_DIR, `${locale}.json`), "utf8"),
  ) as Json[];

/**
 * The English half of a prose file: every translatable field, and nothing
 * structural. Comparing each locale against this proves a file has the same
 * shape as the entries it will be overlaid onto -- which is what stops a short
 * or reordered file from silently grafting one release's text onto another's
 * version number and date.
 */
function proseShape(entries: readonly ChangelogEntry[]): Json[] {
  return entries.map((entry) => ({
    version: entry.version,
    title: entry.title,
    summary: entry.summary,
    groups: entry.groups.map((group) => ({
      title: group.title,
      ...(group.description === undefined
        ? {}
        : { description: group.description }),
      ...(group.changes === undefined
        ? {}
        : {
            changes: group.changes.map((change) =>
              typeof change === "string"
                ? change
                : {
                    segments: change.segments.map((segment) =>
                      typeof segment === "string"
                        ? segment
                        : { text: segment.text },
                    ),
                  },
            ),
          }),
      ...(group.tables === undefined
        ? {}
        : {
            tables: group.tables.map((table) => ({
              caption: table.caption,
              columns: [...table.columns],
              rows: table.rows.map((row) => ({
                label: row.label,
                values: [...row.values],
              })),
            })),
          }),
      ...(group.note === undefined ? {} : { note: group.note }),
    })),
  }));
}

/** Same keys, same array lengths, every leaf a non-empty string. */
function shapeProblems(expected: Json, actual: Json, at: string): string[] {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return [`${at}: expected an array`];
    if (actual.length !== expected.length) {
      return [`${at}: ${actual.length} items, English has ${expected.length}`];
    }
    return expected.flatMap((item, i) =>
      shapeProblems(item, actual[i], `${at}[${i}]`),
    );
  }

  if (typeof expected === "object") {
    if (
      typeof actual !== "object" ||
      Array.isArray(actual) ||
      actual === null
    ) {
      return [`${at}: expected an object`];
    }

    const missing = Object.keys(expected)
      .filter((key) => !(key in actual))
      .map((key) => `${at}.${key}: missing`);
    const unknown = Object.keys(actual)
      .filter((key) => !(key in expected))
      .map((key) => `${at}.${key}: unknown field`);

    return [
      ...missing,
      ...unknown,
      ...Object.keys(expected)
        .filter((key) => key in actual)
        .flatMap((key) =>
          shapeProblems(expected[key], actual[key], `${at}.${key}`),
        ),
    ];
  }

  return typeof actual === "string" && actual.trim() !== ""
    ? []
    : [`${at}: empty or non-string`];
}

/**
 * A single character from the wrong script -- a CJK glyph mid-word in a
 * Cyrillic sentence -- is invisible in review and survives every structural
 * check. Same guard the Learn prose validator runs, for the same reason.
 */
const SCRIPT_RANGES: Record<string, RegExp> = {
  cyrillic: /[\u0400-\u04FF]/,
  devanagari: /[\u0900-\u097F]/,
  cjk: /[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uFF00-\uFFEF]/,
  hangul: /[\uAC00-\uD7AF\u1100-\u11FF]/,
};

const ALLOWED_SCRIPTS: Record<string, string[]> = {
  ru: ["cyrillic"],
  hi: ["devanagari"],
  ja: ["cjk"],
  ko: ["hangul", "cjk"],
  "zh-CN": ["cjk"],
  "zh-TW": ["cjk"],
};

function strayScripts(value: Json, locale: string, at: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      strayScripts(item, locale, `${at}[${i}]`),
    );
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      strayScripts(item, locale, `${at}.${key}`),
    );
  }

  const allowed = new Set(ALLOWED_SCRIPTS[locale] ?? []);
  return Object.entries(SCRIPT_RANGES)
    .filter(([name]) => !allowed.has(name))
    .flatMap(([name, pattern]) => {
      const hit = value.match(pattern);
      return hit
        ? [
            `${at}: stray ${name} character "${hit[0]}" in "${value.slice(0, 60)}"`,
          ]
        : [];
    });
}

describe("changelog locale coverage", () => {
  const english = proseShape(CHANGELOG_ENTRIES);

  it("ships translated release notes for every locale", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(fs.existsSync(path.join(PROSE_DIR, `${locale}.json`))).toBe(true);
    }
  });

  it("keeps every prose file aligned with the English entries", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      const prose = readProse(locale);

      // Versions are the alignment key: entry i must be the same release.
      expect(
        prose.map((entry) => (entry as { version: string }).version),
      ).toEqual(CHANGELOG_ENTRIES.map((entry) => entry.version));
      expect(shapeProblems(english, prose, `[${locale}] entries`)).toEqual([]);
    }
  });

  it("keeps each locale in its own script", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(
        strayScripts(readProse(locale), locale, `[${locale}] entries`),
      ).toEqual([]);
    }
  });

  it("never lets a translation supply a version, date or href", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      const entries = getLocalizedChangelogEntries(locale);

      expect(entries).toHaveLength(CHANGELOG_ENTRIES.length);

      entries.forEach((entry, index) => {
        const source = CHANGELOG_ENTRIES[index];

        expect(entry.version).toBe(source.version);
        expect(entry.publishedAt).toBe(source.publishedAt);

        const hrefs = entry.groups.flatMap((group) =>
          (group.changes ?? []).flatMap((change) =>
            typeof change === "string"
              ? []
              : change.segments.flatMap((segment) =>
                  typeof segment === "string" ? [] : [segment.href],
                ),
          ),
        );
        const sourceHrefs = source.groups.flatMap((group) =>
          (group.changes ?? []).flatMap((change) =>
            typeof change === "string"
              ? []
              : change.segments.flatMap((segment) =>
                  typeof segment === "string" ? [] : [segment.href],
                ),
          ),
        );

        expect(hrefs).toEqual(sourceHrefs);
      });
    }
  });

  it("actually translates, rather than falling back to English", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      const [latest] = getLocalizedChangelogEntries(locale);

      expect(latest.title).not.toBe(CHANGELOG_ENTRIES[0].title);
      expect(latest.summary).not.toBe(CHANGELOG_ENTRIES[0].summary);
    }
  });

  it("falls back to English for a locale with no prose file", () => {
    expect(getLocalizedChangelogEntries(DEFAULT_LOCALE)).toBe(
      CHANGELOG_ENTRIES,
    );
    expect(getLocalizedChangelogEntries("xx")).toBe(CHANGELOG_ENTRIES);
  });
});
