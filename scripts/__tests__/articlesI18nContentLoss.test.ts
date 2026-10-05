/** @jest-environment node */

import { evalChecks } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

type Lengths = { readonly english: number; readonly translated: number };
type Case = Readonly<Record<string, readonly Lengths[]>>;

// A word the language rule reads as German, so only the length of a leaf is under test.
const GERMAN_WORD = "und";

const sized = (word: string, length: number) => `${`${word} `.repeat(length).slice(0, length - 1)}${word[0]}`;
const same = (english: number, count: number): Lengths[] => Array.from({ length: count }, () => ({ english, translated: english }));

const sectionOf = (word: string, heading: string, lengths: readonly number[]) => ({
  sections: [{ heading, paragraphs: lengths.map((length) => sized(word, length)) }],
});

function failuresOf(cases: readonly Case[]): string[][] {
  const bundles = cases.map((paragraphs) => ({
    articles: Object.entries(paragraphs).map(([slug, lengths]) => ({
      slug,
      sourceHash: "",
      text: sectionOf("word", "Heading", lengths.map((one) => one.english)),
    })),
    units: Object.fromEntries(
      Object.entries(paragraphs).map(([slug, lengths]) => [
        slug,
        { sameAsEnglish: [], text: sectionOf(GERMAN_WORD, "Titel", lengths.map((one) => one.translated)) },
      ]),
    ),
  }));

  return evalChecks(
    `${JSON.stringify(bundles)}.map(({ articles, units }) => checks.failuresOf("de", ` +
      `{ lib: { shapeProblems: () => [] }, articles, chrome: { strings: {}, sourceHash: "" } }, ` +
      `{ installed: false, problems: [], sameAsEnglishKeys: [], articles: units, chrome: { text: {}, sameAsEnglish: [] } }))`,
  );
}

const dropped = (where: string, length: number, english: number, share: string) =>
  `${where}: ${length} characters for ${english} in English is ${share} of this translation's usual ratio, the least is 0.7, text looks dropped`;

describe("the content loss rule", () => {
  it("fails a body leaf whose length is under 0.7 of the usual ratio of its translation", () => {
    const failures = failuresOf([
      { ada: [...same(100, 5), { english: 100, translated: 69 }] },
      { ada: [...same(100, 5), { english: 100, translated: 70 }] },
      { ada: [...same(100, 5), { english: 200, translated: 2 }] },
    ]);

    expect(failures).toEqual([
      [dropped("ada sections[0].paragraphs[5]", 69, 100, "0.69")],
      [],
      [dropped("ada sections[0].paragraphs[5]", 2, 200, "0.01")],
    ]);
  });

  it("measures a translation against its own median, so a compact script is not short", () => {
    const compact = Array.from({ length: 5 }, () => ({ english: 100, translated: 40 }));

    const failures = failuresOf([
      { ada: [...compact, { english: 100, translated: 40 }] },
      { ada: [...compact, { english: 100, translated: 26 }] },
      { ada: [...same(100, 5), { english: 100, translated: 40 }] },
    ]);

    expect(failures).toEqual([
      [],
      [dropped("ada sections[0].paragraphs[5]", 26, 100, "0.65")],
      [dropped("ada sections[0].paragraphs[5]", 40, 100, "0.40")],
    ]);
  });

  it("leaves an English leaf of 80 characters or fewer alone, however short its translation", () => {
    const failures = failuresOf([
      { ada: [...same(100, 5), { english: 80, translated: 8 }] },
      { ada: [...same(100, 5), { english: 81, translated: 8 }] },
    ]);

    expect(failures).toEqual([[], [dropped("ada sections[0].paragraphs[5]", 8, 81, "0.10")]]);
  });

  it("says nothing with fewer than 5 long leaves, and counts the leaves of every article of the locale", () => {
    const short = { english: 100, translated: 5 };

    const failures = failuresOf([
      { ada: [...same(100, 3), short] },
      { ada: [...same(100, 4), short] },
      { ada: same(100, 2), ben: [...same(100, 2), short] },
    ]);

    expect(failures).toEqual([
      [],
      [dropped("ada sections[0].paragraphs[4]", 5, 100, "0.05")],
      [dropped("ben sections[0].paragraphs[2]", 5, 100, "0.05")],
    ]);
  });
});
