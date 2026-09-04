import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { LOCALES } from "@/i18n/routing";

/**
 * The Record types in prose.ts make a missing key a build error, but nothing
 * type-checks the inside of a string. A translation that drops {threshold}
 * renders "at least % correct" and no gate notices, so the token sets are
 * compared here instead.
 */
const PROSE_DIR = path.join(__dirname, "..", "prose");

type Leaf = [string, string];

function leaves(node: unknown, prefix = ""): Leaf[] {
  if (typeof node === "string") return [[prefix, node]];
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) =>
      leaves(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

function read(locale: string): Map<string, string> {
  return new Map(
    leaves(JSON.parse(readFileSync(path.join(PROSE_DIR, `${locale}.json`), "utf8"))),
  );
}

function tokens(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

const english = read("en");
const translated = readdirSync(PROSE_DIR)
  .filter((name) => name.endsWith(".json") && name !== "en.json")
  .map((name) => name.replace(/\.json$/, ""))
  .sort();

test("every shipped locale has a reference prose file", () => {
  expect([...translated, "en"].sort()).toEqual([...LOCALES].sort());
});

describe.each(translated)("%s", (locale) => {
  const prose = read(locale);

  test("matches the English key set exactly", () => {
    expect([...prose.keys()].sort()).toEqual([...english.keys()].sort());
  });

  test("preserves every placeholder token", () => {
    for (const [key, value] of english) {
      expect({ key, tokens: tokens(prose.get(key) ?? "") }).toEqual({
        key,
        tokens: tokens(value),
      });
    }
  });

  test("keeps the product name verbatim", () => {
    for (const [key, value] of english) {
      if (!value.includes("Memory Chess")) continue;
      expect(prose.get(key)).toContain("Memory Chess");
    }
  });

  test("leaves no substantial string untranslated", () => {
    const copied = [...english].filter(
      ([key, value]) => value.split(/\s+/).length > 6 && prose.get(key) === value,
    );
    expect(copied.map(([key]) => key)).toEqual([]);
  });
});
