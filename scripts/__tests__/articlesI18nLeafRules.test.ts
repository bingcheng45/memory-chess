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
      [
        kept("zh-CN", `${NAMES_KEPT}${UNTRANSLATED_SENTENCE}`),
        [
          "15 of 75 letters are Han, at least half must be",
          "4 of 33 words are English (and, this, from, the), the text looks untranslated",
        ],
      ],
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

describe("the rules for a leaf that still reads as English", () => {
  const SENTENCE = "He faced away from all ten boards and called out his moves.";
  const PARAGRAPH =
    "On Joe Rogan's podcast in February 2025 he gave more detail, according to a published transcript. " +
    "He sees the board in his head. In a simultaneous display he thinks about one game at a time and stores the others away. " +
    "He said he remembers the games he has played in broad strokes, not move by move. " +
    "In blindfold games, he added, he can be unsure whether a pawn at the side of the board has moved one square.";
  const BOOK = "Thought and Choice in Chess (1965)";
  const BOOK_IN_JAPANESE = "Thought and Choice in Chess（1965年）";
  const body = (locale: string, english: string, value: string, path = "sections[0].paragraphs[0]"): Leaf => ({
    locale,
    kind: "article",
    path,
    english,
    value,
    isListed: false,
  });
  const copyOf = (kept: number, total: number) => `${kept} of ${total} English words are still here, the text looks untranslated`;
  const englishWords = (count: number, total: number, words: string) =>
    `${count} of ${total} words are English (${words}), the text looks untranslated`;

  describe("as a copy of its English leaf", () => {
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("de", SENTENCE, `${SENTENCE} Ja.`), [copyOf(12, 12)]],
      [body("ru", SENTENCE, `Смотрите: ${SENTENCE}`), [copyOf(12, 12)]],
      [body("de", "The rack of small positions", "The rack of small Stellungen", "sections[1].heading"), [copyOf(4, 5)]],
      [body("de", "She won every game.", "She won every Partie."), []],
      [body("nl", "Try de Groot's test", "Probeer de test van De Groot", "sections[5].heading"), []],
      [body("ja", BOOK, BOOK_IN_JAPANESE, "facts.knownFor"), []],
      [body("ja", BOOK, BOOK_IN_JAPANESE, "sections[5].heading"), [copyOf(5, 5)]],
      [
        body("ja", "Recalled the board after five seconds", "Recalled the board after five seconds（1965年）", "facts.memoryFeat"),
        [copyOf(6, 6)],
      ],
      [body("de", "Unknown photographer of the chess club", "Unknown photographer of the chess club Berlin", "photo.author"), []],
      [{ ...body("de", SENTENCE, `${SENTENCE} Ja.`, "list.about1"), kind: "chrome" }, []],
    ];

    it("fails an article leaf that keeps four English words in five, and lets a short name or title stay", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });

  describe("as English prose that is not a copy", () => {
    const OTHER_SENTENCE =
      "They said that she could not have won this game without the help of those who were with her from the start.";
    const OTHER_SENTENCE_FAILS = [englishWords(12, 22, "they, that, she, could, this, the, those, who, were, with, from")];
    const TITLES = "Thought and Choice in Chess, The Game of the Century, From Morphy to Fischer";
    const GERMAN_WITH_TITLES =
      "Drei Bücher prägten das Feld: Thought and Choice in Chess von Adriaan de Groot, The Game of the Century " +
      "über die berühmte Partie von Bobby Fischer und From Morphy to Fischer, eine Geschichte der Weltmeister. " +
      "Alle drei erschienen zuerst auf Englisch, und alle drei werden bis heute von Trainern, Forschern und Spielern " +
      "gelesen, die verstehen wollen, wie starke Spieler eine Stellung im Gedächtnis behalten.";
    const DUTCH_SOURCE =
      "She was back at Amber in 1994. In the blindfold section she beat Ljubojević with the black pieces in a game of 106 moves. " +
      "Her 83rd move left her with a king, a bishop and a knight against a lone king. " +
      "The game record at Chessgames.com ends after White's 106th move. " +
      "In the final position the white king is in a corner and she has checkmate on her next move.";
    const DUTCH =
      "In 1994 was ze weer bij Amber. In het blindtoernooi versloeg ze Ljubojević met zwart in een partij van 106 zetten. " +
      "Na haar 83e zet bleef ze over met een koning, een loper en een paard tegen een blote koning. " +
      "De partijnotatie op Chessgames.com eindigt na de 106e zet van wit. " +
      "In de eindstelling staat de witte koning in een hoek en geeft zij bij haar volgende zet mat.";
    const LONG_TITLE = "What the Hands and the Eyes Tell Those Who Watch: Notes from the Board";
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("de", "She won every game.", OTHER_SENTENCE), OTHER_SENTENCE_FAILS],
      [body("hi", PARAGRAPH, `देखिए: ${PARAGRAPH}`), [copyOf(78, 78), englishWords(10, 79, "the, his, about, and, has")]],
      [body("nl", DUTCH_SOURCE, DUTCH), []],
      [body("de", "Three books shaped the field.", GERMAN_WITH_TITLES), []],
      [body("de", "Three books shaped the field.", TITLES), [englishWords(4, 14, "and, the, from")]],
      [
        { ...body("de", "Each article follows one chess player.", OTHER_SENTENCE, "list.about1"), kind: "chrome" },
        OTHER_SENTENCE_FAILS,
      ],
      [body("de", LONG_TITLE, LONG_TITLE, "sources[2].title"), []],
      [
        { ...body("de", LONG_TITLE, LONG_TITLE, "facts.knownFor"), isListed: true },
        [englishWords(8, 14, "what, the, and, those, who, from")],
      ],
    ];

    it("fails a leaf of either kind with more than three English-only words that are one word in ten or more", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });
});
