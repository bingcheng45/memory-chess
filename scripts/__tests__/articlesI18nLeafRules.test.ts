/** @jest-environment node */

import { evalChecks } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const NBSP = String.fromCharCode(0xa0);
const NARROW_NBSP = String.fromCharCode(0x202f);

type Leaf = {
  readonly locale: string;
  readonly kind: "article" | "chrome";
  readonly path: string;
  readonly english: string;
  readonly value: string;
  readonly isListed: boolean;
};

const problemsOf = (leaves: readonly Leaf[]) =>
  evalChecks(`${JSON.stringify(leaves)}.map((leaf) => checks.leafProblems(leaf))`);

describe("the number rule", () => {
  const MISSING_2012 = ["the number 2012 of the English text is missing"];
  const CASES: [english: string, translated: string, problems: string[]][] = [
    ["She recalled 50,000 positions", "Sie merkte sich 50.000 Stellungen", []],
    ["She recalled 50,000 positions", "Elle a retenu 50 000 positions", []],
    ["She recalled 50,000 positions", `Elle a retenu 50${NBSP}000 positions`, []],
    ["She recalled 50,000 positions", `Elle a retenu 50${NARROW_NBSP}000 positions`, []],
    ["She recalled 50,000 positions", "Sie merkte sich 50'000 Stellungen", []],
    ["She recalled 50,000 positions", "Sie merkte sich 5000 Stellungen", ["the number 50000 of the English text is missing"]],
    ["In 2012 he won 3 games", "२०१२ में उसने ३ बाज़ियाँ जीतीं", []],
    ["In 2012 he won", "Er gewann", MISSING_2012],
    ["In 2012 he won", "2013 gewann er", MISSING_2012],
    ["In 2012 he won", "Er gewann im Jahr 20125", MISSING_2012],
    ["It was 1851, not 1859", "Es war nicht 1859, sondern 1851", []],
    ["Champion, 2013-2023", "Weltmeister seit 2013", ["the number 2023 of the English text is missing"]],
    ["12 boards and 12 clocks", "12 Bretter und Uhren", ["the number 12 is in the English text 2 times and here 1 time"]],
    ["He won 3 games", "Er gewann 3 Partien, alle mit 1.e4", []],
    ["In the 1980s she won", "Negli anni Ottanta vinse", []],
    ["In the 1980s she won", "In de jaren tachtig won zij", []],
    ["In the 1980s she won", "W latach 80. wygrała", []],
    ["In the 1980s she won 3 games", "Negli anni Ottanta vinse", ["the number 3 of the English text is missing"]],
    ["In 1980 she won", "Negli anni Ottanta vinse", ["the number 1980 of the English text is missing"]],
    ["In 1980 and in the 1980s", "Nel 1980 e negli anni Ottanta", []],
    ["In 1980 and in the 1980s", "Negli anni Ottanta", ["the number 1980 of the English text is missing"]],
    ["From 1985 to the 1990s", "Dal tempo degli anni Novanta", ["the number 1985 of the English text is missing"]],
  ];

  it("compares the digit runs of one leaf as multisets, whatever the separators and the digits", () => {
    const pairs = CASES.map(([english, translated]) => [english, translated]);

    const problems = evalChecks(`${JSON.stringify(pairs)}.map(([english, translated]) => checks.numberProblems(english, translated))`);

    expect(problems).toEqual(CASES.map(([, , expected]) => expected));
  });
});

describe("the script rule", () => {
  const latin = (count: number) => "a".repeat(count);
  const leaf = (locale: string, value: string): Leaf => ({
    locale,
    kind: "article",
    path: "sections[0].paragraphs[0]",
    english: "English",
    value,
    isListed: false,
  });
  const LONG_ARGUMENT = "numberOfViewsOfThisArticle";
  const JAPANESE = `${"あ".repeat(10)}${"ア".repeat(5)}ー${"漢".repeat(4)}`;
  const CASES: [leaf: Leaf, problems: string[]][] = [
    [leaf("ru", latin(40)), ["0 of 40 letters are Cyrillic, at least half must be"]],
    [leaf("ru", latin(39)), []],
    [leaf("ru", `${latin(20)} ${"я".repeat(20)}`), []],
    [leaf("ru", `${latin(21)} ${"я".repeat(20)}`), ["20 of 41 letters are Cyrillic, at least half must be"]],
    [leaf("ja", `${latin(20)} ${JAPANESE}`), []],
    [leaf("ja", `${latin(21)} ${JAPANESE}`), ["20 of 41 letters are Hiragana or Katakana or Han, at least half must be"]],
    [leaf("hi", `${latin(20)} ${"क".repeat(20)}`), []],
    [leaf("hi", `${latin(21)} ${"क".repeat(20)}`), ["20 of 41 letters are Devanagari, at least half must be"]],
    [leaf("ko", `${latin(21)} ${"한".repeat(20)}`), ["20 of 41 letters are Hangul, at least half must be"]],
    [leaf("zh-CN", `${latin(21)} ${"棋".repeat(20)}`), ["20 of 41 letters are Han, at least half must be"]],
    [leaf("zh-TW", `${latin(20)} ${"棋".repeat(20)}`), []],
    [leaf("de", latin(60)), []],
    [
      {
        ...leaf("ru", `{${LONG_ARGUMENT}, plural, one {# вид} few {# вида} many {# видов} other {# видов}}`),
        kind: "chrome",
        path: "counts.views",
        english: `{${LONG_ARGUMENT}, plural, one {# view} other {# views}}`,
      },
      [],
    ],
    [{ ...leaf("ru", latin(60)), english: latin(60), isListed: true }, []],
  ];

  it("wants half the letters of a long leaf in the script of the language, without counting ICU syntax", () => {
    expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
  });

  describe("with names and titles kept in Latin letters", () => {
    const SOURCE =
      "Garry Kasparov, Magnus Carlsen, Judit Polgár and Adriaan de Groot met at Linares and Wijk aan Zee, " +
      "the tournaments that shaped Thought and Choice in Chess.";
    const NAMES_KEPT =
      "Garry Kasparov、Magnus Carlsen、Judit Polgár 和 Adriaan de Groot 相聚于 Linares 与 Wijk aan Zee，" +
      "这些赛事塑造了 Thought and Choice in Chess 的研究。";
    const UNTRANSLATED_SENTENCE = " Nobody expected this surprising result from the young unknown challenger.";
    const UNTRANSLATED = "Kasparov met Carlsen and Polgár at Linares and Wijk aan Zee";
    const kept = (locale: string, value: string, isListed = false): Leaf => ({
      ...leaf(locale, value),
      english: SOURCE,
      isListed,
    });
    const NO_SCRIPT = ["no letter is Han, the text looks untranslated"];
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [kept("zh-CN", NAMES_KEPT), []],
      [kept("zh-TW", NAMES_KEPT), []],
      [kept("zh-CN", `${NAMES_KEPT}${UNTRANSLATED_SENTENCE}`), ["15 of 75 letters are Han, at least half must be"]],
      [kept("zh-CN", UNTRANSLATED), NO_SCRIPT],
      [kept("zh-CN", UNTRANSLATED, true), []],
      [kept("zh-CN", "Kasparov met Carlsen at Linares"), NO_SCRIPT],
      [{ ...kept("zh-CN", "Norway cold"), english: "Norway is cold" }, []],
    ];

    it("does not count a Latin token that the English text has at the same path, and still fails real English", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });

  it("fails a locale whose script has no rule yet, in one line that says where to add it", () => {
    const source = '{ lib: { shapeProblems: () => [] }, articles: [], chrome: { strings: {}, sourceHash: "" } }';
    const bundle = "{ installed: false, problems: [], sameAsEnglishKeys: [], articles: {}, chrome: { text: {}, sameAsEnglish: [] } }";

    const failures = evalChecks(`["th", "de", "ru"].map((locale) => checks.failuresOf(locale, ${source}, ${bundle}))`);

    expect(failures).toEqual([["th: no script rule for Thai, add one to scripts/articles-i18n/checks.mjs"], [], []]);
  });
});

describe("the full stop rule", () => {
  const GAINED = ["ends with a full stop, the English text does not"];
  const IDEOGRAPHIC_FULL_STOP = String.fromCodePoint(0x3002);
  const DANDA = String.fromCodePoint(0x964);
  const ended = (locale: string, english: string, value: string): Leaf => ({
    locale,
    kind: "article",
    path: "photo.changes",
    english,
    value,
    isListed: false,
  });
  const CASES: [leaf: Leaf, problems: string[]][] = [
    [ended("de", "Cropped", "Zugeschnitten."), GAINED],
    [ended("de", "Cropped", "Zugeschnitten"), []],
    [ended("de", "Cropped", "Zugeschnitten. Aufgehellt"), []],
    [ended("de", "She won.", "Sie gewann."), []],
    [ended("de", 'She said, "I won."', "Sie sagte: 'Ich gewann'."), []],
    [ended("de", "2882 (2014)", "2882 (2014)."), GAINED],
    [ended("ja", "Cropped", `棋${IDEOGRAPHIC_FULL_STOP}`), GAINED],
    [ended("zh-CN", "She won.", `棋${IDEOGRAPHIC_FULL_STOP}`), []],
    [ended("hi", "Cropped", `क${DANDA}`), GAINED],
    [ended("hi", "She won.", `क${DANDA}`), []],
    [{ ...ended("de", "Articles", "Artikel."), kind: "chrome", path: "list.heading" }, GAINED],
  ];

  it("fails a leaf that ends with a full stop of any script when the English leaf ends without one", () => {
    expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
  });
});

describe("the identical rule", () => {
  const IDENTICAL = ["identical to the English text, list the path in sameAsEnglish if that is right"];
  const kept = (path: string, english: string, kind: Leaf["kind"] = "article", isListed = false): Leaf => ({
    locale: "de",
    kind,
    path,
    english,
    value: english,
    isListed,
  });
  const CASES: [leaf: Leaf, problems: string[]][] = [
    [kept("facts.country", "Norway"), IDENTICAL],
    [kept("facts.country", "Norway", "article", true), []],
    [kept("facts.peakRating", "2882 (2014)"), []],
    [kept("person.name", "Magnus Carlsen"), []],
    [kept("photo.author", "Unknown photographer"), []],
    [kept("photo.license", "CC BY 4.0"), []],
    [kept("sources[10].title", "Thought and Choice in Chess"), []],
    [kept("sources[10].note", "A book."), IDENTICAL],
    [kept("person.name", "Magnus Carlsen", "chrome"), IDENTICAL],
    [kept("page.sources", "Sources", "chrome", true), []],
  ];

  it("fails a leaf left in English unless it has no letter, is a name the page keeps, or is listed", () => {
    expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
  });
});
