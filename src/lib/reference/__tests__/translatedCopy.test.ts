import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { LOCALES } from "@/i18n/routing";

/**
 * Site copy uses no em or en dash, in any language, and a preposition before
 * "de Groot" must not read as a doubled particle ("de de Groot", "di de Groot").
 * The article tool refuses a dash in article text, but nothing else checks the
 * catalogues or the reference prose, and both slips shipped there.
 */
const ROOT = path.join(__dirname, "..", "..", "..", "..");
const LONG_DASH = /[‒-―]/;
const DOUBLED_PARTICLE = /(?<!\p{L})(de|di|van|du|da|del|des) de Groot/u;

function leaves(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) =>
      leaves(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));

function translatedFiles(): string[] {
  const locales = LOCALES.filter((locale) => locale !== "en");
  return locales.flatMap((locale) => [
    `messages/${locale}.json`,
    `src/lib/reference/prose/${locale}.json`,
    ...readdirSync(path.join(ROOT, "src/lib/articles/translations", locale))
      .filter((name) => name.endsWith(".json"))
      .map((name) => `src/lib/articles/translations/${locale}/${name}`),
  ]);
}

function offenders(rule: RegExp, files: string[]): string[] {
  return files.flatMap((file) =>
    leaves(readJson(file))
      .filter(([, value]) => rule.test(value))
      .map(([key]) => `${file} ${key}`),
  );
}

describe("translated copy", () => {
  const files = translatedFiles();

  it("reads every catalogue, prose file and article translation", () => {
    expect(files).toContain("messages/ru.json");
    expect(files).toContain("src/lib/reference/prose/ru.json");
    expect(files).toContain("src/lib/articles/translations/it/adriaan-de-groot.json");
    expect(files).toHaveLength(23 * 2 + 23 * 7);
  });

  it("finds a long dash and a doubled particle where they are", () => {
    expect(LONG_DASH.test("Только короли — идеально")).toBe(true);
    expect(LONG_DASH.test("Only kings - perfect")).toBe(false);
    expect(DOUBLED_PARTICLE.test("les expériences de de Groot")).toBe(true);
    expect(DOUBLED_PARTICLE.test("les expériences de De Groot")).toBe(false);
    expect(DOUBLED_PARTICLE.test("Adriaan de Groot")).toBe(false);
  });

  it("has no em or en dash in any locale", () => {
    expect(offenders(LONG_DASH, files)).toEqual([]);
  });

  it("never doubles the particle of de Groot", () => {
    expect(offenders(DOUBLED_PARTICLE, files)).toEqual([]);
  });
});
