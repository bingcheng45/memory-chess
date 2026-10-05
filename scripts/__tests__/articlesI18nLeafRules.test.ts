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
    [leaf("de", `${"क".repeat(20)} ${latin(20)}`), []],
    [leaf("de", `${"क".repeat(21)} ${latin(20)}`), ["20 of 41 letters are Latin, at least half must be"]],
    [leaf("vi", "я".repeat(40)), ["0 of 40 letters are Latin, at least half must be"]],
    [leaf("vi", "я".repeat(39)), []],
    [{ ...leaf("de", "शतरंज की स्मृति"), english: "The memory of chess players" }, ["no letter is Latin, the text is in another script"]],
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

  describe("with a title kept in another script in a language written in Latin letters", () => {
    const RUSSIAN_TITLE = "Шахматы и память: как гроссмейстеры запоминают позиции";
    const SOURCE = `His book ${RUSSIAN_TITLE} stayed in print.`;
    const GERMAN = `Sein Buch ${RUSSIAN_TITLE} blieb lieferbar.`;
    const german = (english: string): Leaf => ({ ...leaf("de", GERMAN), english });

    it("does not count a token that the English text has at the same path, and counts it when the English text does not", () => {
      expect(problemsOf([german(SOURCE), german("His book stayed in print for years.")])).toEqual([
        [],
        ["22 of 69 letters are Latin, at least half must be"],
      ]);
    });
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

  it("fails a locale that has no script rule and no language rule yet, in lines that say where to add them", () => {
    const source = '{ lib: { shapeProblems: () => [] }, articles: [], chrome: { strings: {}, sourceHash: "" } }';
    const bundle = "{ installed: false, problems: [], sameAsEnglishKeys: [], articles: {}, chrome: { text: {}, sameAsEnglish: [] } }";

    const failures = evalChecks(`["th", "de", "ru"].map((locale) => checks.failuresOf(locale, ${source}, ${bundle}))`);

    expect(failures).toEqual([
      [
        "th: no script rule for Thai, add one to scripts/articles-i18n/checks.mjs",
        "th: no language rule, add one to scripts/articles-i18n/language.mjs",
      ],
      [],
      [],
    ]);
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
  const WHAT_TO_DO =
    "Translate it, or keep in English only what the English text has word for word inside a sentence that is otherwise translated, such as a title";
  const englishSentences = (locale: string, count: number, total: number, first: string) =>
    `not in ${locale}: English function words outnumber ${locale} ones by more than 3 in ${count} of ${total} sentences, the first: "${first}". ${WHAT_TO_DO}`;
  const englishAsAWhole = (locale: string, lead: number) =>
    `not in ${locale} as a whole: ${lead} more English function words than ${locale} ones. ${WHAT_TO_DO}`;

  describe("as a copy of its English leaf", () => {
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("de", SENTENCE, `${SENTENCE} Ja.`), [copyOf(12, 12), englishSentences("de", 1, 2, SENTENCE)]],
      [body("ru", SENTENCE, `Смотрите: ${SENTENCE}`), [copyOf(12, 12), englishSentences("ru", 1, 1, `Смотрите: ${SENTENCE}`)]],
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
      [{ ...body("de", SENTENCE, `${SENTENCE} Ja.`, "list.about1"), kind: "chrome" }, [englishSentences("de", 1, 2, SENTENCE)]],
    ];

    it("fails an article leaf that keeps four English words in five, and lets a short name or title stay, whatever the English rule says", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });

  describe("as English prose that is not a copy", () => {
    const OTHER_SENTENCE =
      "They said that she could not have won this game without the help of those who were with her from the start.";
    const OTHER_SENTENCE_FAILS = [englishSentences("de", 1, 1, OTHER_SENTENCE)];
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
    const HINDI_LEAD_IN = "शतरंज की स्मृति पर लिखी गई ये तीन पुरानी और बहुत प्रसिद्ध किताबें आज भी दुनिया भर के खिलाड़ियों और शोधकर्ताओं द्वारा ध्यान से पढ़ी जाती हैं:";
    const LONG_TITLE = "What the Hands and the Eyes Tell Those Who Watch: Notes from the Board";
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("de", "She won every game.", OTHER_SENTENCE), OTHER_SENTENCE_FAILS],
      [body("hi", PARAGRAPH, `देखिए: ${PARAGRAPH}`), [copyOf(78, 78), englishSentences("hi", 5, 5, "देखिए: On Joe Rogan's podcast in February 2025 he gave more detail, according to a published transcript.")]],
      [body("nl", DUTCH_SOURCE, DUTCH), []],
      [body("de", "Three books shaped the field.", GERMAN_WITH_TITLES), []],
      [body("de", "Three books shaped the field.", TITLES), [englishSentences("de", 1, 1, TITLES)]],
      [body("hi", "Three books shaped the field.", `${HINDI_LEAD_IN} ${TITLES}।`), [englishSentences("hi", 1, 1, `${HINDI_LEAD_IN} ${TITLES}।`)]],
      [
        { ...body("de", "Each article follows one chess player.", OTHER_SENTENCE, "list.about1"), kind: "chrome" },
        OTHER_SENTENCE_FAILS,
      ],
      [body("de", LONG_TITLE, LONG_TITLE, "sources[2].title"), []],
      [
        { ...body("de", LONG_TITLE, LONG_TITLE, "facts.knownFor"), isListed: true },
        [englishSentences("de", 1, 1, LONG_TITLE)],
      ],
    ];

    it("fails a leaf of either kind where English is ahead of the locale by more than three function words in one sentence", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });

  describe("with a title or a saying the English leaf has word for word", () => {
    const TITLE = "How Life Imitates Chess: Making the Right Moves, from the Board to the Boardroom";
    const SAYING = "When you see a good move, look for a better one";
    const ABOUT_THE_BOOK = `In his book ${TITLE}, Kasparov wrote about the choices that a manager makes when the clock is running.`;
    const ABOUT_THE_SAYING = `He liked the saying "${SAYING}" and repeated it to his students.`;
    const SOURCE = `${ABOUT_THE_BOOK} ${ABOUT_THE_SAYING}`;
    const HINDI_BOOK = `गैरी कास्पारोव ने अपनी किताब ‘${TITLE}’ में उन फ़ैसलों के बारे में लिखा जो एक प्रबंधक घड़ी चलते समय लेता है।`;
    const HINDI = `${HINDI_BOOK} उन्हें “${SAYING}” वाली कहावत पसंद थी और वे इसे अपने शिष्यों के सामने दोहराते थे।`;
    const JAPANESE = `カスパロフは著書『${TITLE}』で、時計が進むなかで経営者が下す選択について書いた。彼は「${SAYING}」という格言を好み、弟子たちに繰り返し語った。`;
    const GERMAN_BOOK = `Garri Kasparow schrieb sein Buch ${TITLE} für Manager.`;
    const GERMAN = `${GERMAN_BOOK} Ihm gefiel der Spruch „${SAYING}“, und er wiederholte ihn vor seinen Schülern.`;
    const ONE_WORD_CHANGED = ABOUT_THE_SAYING.replace("saying", "Spruch");
    const MOSTLY_KEPT = `Ihm gefiel der Spruch „${SAYING}“ and repeated it to his students.`;
    const OTHER = "Another text stands at this path in the English article.";
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("hi", SOURCE, HINDI), []],
      [body("ja", SOURCE, JAPANESE), []],
      [body("de", SOURCE, GERMAN), []],
      [{ ...body("de", SOURCE, GERMAN, "list.about1"), kind: "chrome" }, []],
      [body("de", OTHER, GERMAN), [englishSentences("de", 1, 2, GERMAN_BOOK)]],
      [body("hi", SOURCE, `${HINDI_BOOK} ${ABOUT_THE_SAYING}`), [englishSentences("hi", 1, 2, ABOUT_THE_SAYING)]],
      [body("de", SOURCE, `${GERMAN_BOOK} ${ABOUT_THE_SAYING}`), [englishSentences("de", 1, 2, ABOUT_THE_SAYING)]],
      [body("de", SOURCE, `${GERMAN_BOOK} ${ONE_WORD_CHANGED}`), [englishSentences("de", 1, 2, ONE_WORD_CHANGED)]],
      [body("de", SOURCE, `${GERMAN_BOOK} ${MOSTLY_KEPT}`), [englishSentences("de", 1, 2, MOSTLY_KEPT)]],
    ];

    it("does not count the kept words, and still fails a sentence that keeps four in five of the words of an English sentence", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });

  describe("as text in another language that English function words give away", () => {
    const FRENCH =
      "On a longtemps cru que la mémoire des maîtres était un don. Il a montré qu'elle tient à ce qu'on a déjà vu, " +
      "et qu'on a tort de la croire générale. On a refait son expérience bien des fois, et on a trouvé le même résultat.";
    const OTHER = "Another text stands at this path in the English article.";

    it("says the text is not in its locale and does not call French English", () => {
      const [problems] = problemsOf([body("de", OTHER, FRENCH)]) as string[][];

      expect(problems.map((problem) => problem.slice(0, 10))).toEqual(["not in de:"]);
      expect(problems.join(" ")).not.toMatch(/reads? as English/);
    });
  });

  describe("as a sentence left in English inside a translated leaf", () => {
    const ITALIAN =
      "Nel podcast di Joe Rogan, nel febbraio 2025, entrò più nel dettaglio, stando a una trascrizione pubblicata. " +
      "Vede la scacchiera nella sua testa. In una simultanea pensa a una partita alla volta e mette da parte le altre.";
    const STROKES = "He said he remembers the games he has played in broad strokes, not move by move.";
    const PAWN = "In blindfold games, he added, he can be unsure whether a pawn at the side of the board has moved one square.";
    const JAPANESE = "彼は頭の中で盤を見ています。同時対局では一度に一局だけを考えます。";
    const HINDI = "वे अपने दिमाग में बिसात देखते हैं। एक साथ कई बाज़ियों में वे एक बार में एक ही बाज़ी के बारे में सोचते हैं।";
    const VIETNAMESE_WITH_A_TITLE = "Nhà xuất bản Mouton ấn hành bản tiếng Anh, Thought and Choice in Chess, tại The Hague năm 1965.";
    const SHORT_SENTENCES = "She won. He lost. It was late. They left.";
    const OTHER = "Another text stands at this path in the English article.";
    const CASES: [leaf: Leaf, problems: string[]][] = [
      [body("it", PARAGRAPH, `${ITALIAN} ${STROKES} ${PAWN}`), [englishSentences("it", 2, 5, STROKES)]],
      [body("it", PARAGRAPH, `${STROKES} ${ITALIAN}`), [englishSentences("it", 1, 4, STROKES)]],
      [body("ja", OTHER, `${JAPANESE.repeat(3)}${PAWN}`), [englishSentences("ja", 1, 7, PAWN)]],
      [body("hi", OTHER, `${HINDI} ${HINDI} ${PAWN}`), [englishSentences("hi", 1, 5, PAWN)]],
      [{ ...body("it", OTHER, `${ITALIAN} ${PAWN}`, "list.about1"), kind: "chrome" }, [englishSentences("it", 1, 4, PAWN)]],
      [body("vi", OTHER, VIETNAMESE_WITH_A_TITLE), []],
      [body("it", OTHER, `${ITALIAN} He won them all.`), []],
      [body("de", OTHER, SHORT_SENTENCES), [englishAsAWhole("de", 5)]],
    ];

    it("fails the leaf and names the first English sentence, in any script, and passes a quoted title or one short sentence", () => {
      expect(problemsOf(CASES.map(([one]) => one))).toEqual(CASES.map(([, expected]) => expected));
    });
  });
});
