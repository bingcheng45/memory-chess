/** @jest-environment node */

import { cpSync } from "node:fs";
import { join } from "node:path";
import { evalChecks, inSandbox, runLever, setTranslatedLocales } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const ENGLISH =
  "The player saw the position for only five seconds, and then the researcher took the board away again. " +
  "After that he had to set up the pieces from memory, and he managed it almost without a mistake, " +
  "because he did not see single pieces but a few familiar groups that he had met many times.";
const GERMAN =
  "Der Spieler sah die Stellung nur fünf Sekunden lang, und dann nahm der Forscher das Brett wieder weg. " +
  "Danach sollte er die Figuren aus dem Gedächtnis aufstellen, und das gelang ihm fast ohne Fehler, " +
  "weil er die Stellung nicht als einzelne Figuren, sondern als wenige vertraute Gruppen sah.";
const FRENCH =
  "Le joueur a regardé la position pendant cinq secondes seulement, puis le chercheur a retiré l'échiquier. " +
  "Il devait ensuite replacer les pièces de mémoire, et il y est parvenu presque sans erreur, " +
  "parce qu'il ne voyait pas des pièces isolées mais quelques groupes qui lui étaient familiers depuis des années.";
const SHORT_FRENCH = "Le livre s'appelle La pensée du joueur d'échecs, et il est paru à Paris.";
const NORWEGIAN =
  "Spilleren så bare stillingen i fem sekunder, og så tok forskeren brettet bort igjen. " +
  "Etterpå skulle han sette opp brikkene etter hukommelsen, og det klarte han nesten uten feil, " +
  "fordi han ikke så enkeltbrikker, men noen få kjente grupper som han hadde sett mange ganger, og som ble til ett bilde.";
const DANISH =
  "Spilleren så kun stillingen i fem sekunder, og så tog forskeren brættet væk igen. " +
  "Derefter skulle han stille brikkerne op efter hukommelsen, og det lykkedes næsten uden fejl, " +
  "fordi han ikke så enkelte brikker, men nogle få velkendte grupper, som han havde set mange gange, og som blev til et billede.";
const SIMPLIFIED =
  "棋手只看了五秒钟这个局面，研究者就把棋盘拿走了。随后他要凭记忆把棋子摆回去，而且几乎没有出错，" +
  "因为他看到的不是一个个单独的棋子，而是几组他多年来早已熟悉的棋形，这些棋形在他下过的对局里出现过很多次。";
const TRADITIONAL =
  "棋手只看了五秒鐘這個局面，研究者就把棋盤拿走了。隨後他要憑記憶把棋子擺回去，而且幾乎沒有出錯，" +
  "因為他看到的不是一個個單獨的棋子，而是幾組他多年來早已熟悉的棋形，這些棋形在他下過的對局裡出現過很多次。";
const JAPANESE =
  "棋士はその局面を五秒間だけ見て、そのあと研究者は盤を片づけました。それから彼は記憶だけで駒を並べ直すように言われ、" +
  "ほとんど間違えずに並べることができました。彼が見ていたのは一つ一つの駒ではなく、何年も前からよく知っている形だったからです。";
const NO_LANGUAGE = Array.from({ length: 120 }, (_, index) => `blorp${"aeiou"[index % 5]}`).join(" ");

const articleOf = (heading: string, paragraphs: readonly string[]) => ({ sections: [{ heading, paragraphs }] });

function failuresOf(locale: string, paragraphs: readonly string[], chrome: Record<string, string> = {}): string[] {
  const english = Object.fromEntries(Object.keys(chrome).map((key) => [key, "An English string of the section."]));
  const source = {
    articles: [{ slug: "ada", sourceHash: "", text: articleOf("Five seconds", paragraphs.map(() => ENGLISH)) }],
    chrome: { strings: english, sourceHash: "" },
  };
  const bundle = {
    installed: false,
    problems: [],
    sameAsEnglishKeys: [],
    articles: { ada: { sameAsEnglish: [], text: articleOf("Fünf", paragraphs) } },
    chrome: { text: chrome, sameAsEnglish: [] },
  };

  return evalChecks(
    `checks.failuresOf(${JSON.stringify(locale)}, { lib: { shapeProblems: () => [] }, ...${JSON.stringify(source)} }, ${JSON.stringify(bundle)})`,
  );
}

const thrice = (paragraph: string) => [paragraph, paragraph, paragraph];

describe("the language rule, on an article as a whole", () => {
  it("passes an article written in its locale's language", () => {
    expect([
      failuresOf("de", thrice(GERMAN)),
      failuresOf("fr", thrice(FRENCH)),
      failuresOf("no", thrice(NORWEGIAN)),
      failuresOf("da", thrice(DANISH)),
      failuresOf("zh-CN", thrice(SIMPLIFIED)),
      failuresOf("zh-TW", thrice(TRADITIONAL)),
      failuresOf("ja", thrice(JAPANESE)),
    ]).toEqual([[], [], [], [], [], [], []]);
  });

  it("fails a French article in the German locale, as a whole and in each long paragraph", () => {
    expect(failuresOf("de", thrice(FRENCH))).toEqual([
      "ada: the text as a whole reads as fr, not de: 63 words of fr that de does not have, and 0 the other way",
      "ada sections[0].paragraphs[0]: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
      "ada sections[0].paragraphs[1]: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
      "ada sections[0].paragraphs[2]: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
    ]);
  });

  const wholeAndEachParagraph = (whole: string, paragraph: string) => [
    `ada: the text as a whole ${whole}`,
    ...[0, 1, 2].map((index) => `ada sections[0].paragraphs[${index}]: ${paragraph}`),
  ];

  it("tells Norwegian from Danish, the two closest locales, in both directions", () => {
    expect([failuresOf("no", thrice(DANISH)), failuresOf("da", thrice(NORWEGIAN))]).toEqual([
      wholeAndEachParagraph(
        "reads as da, not no: 15 words of da that no does not have, and 0 the other way",
        "reads as da, not no: 5 words of da that no does not have, and 0 the other way",
      ),
      wholeAndEachParagraph(
        "reads as no, not da: 18 words of no that da does not have, and 0 the other way",
        "reads as no, not da: 6 words of no that da does not have, and 0 the other way",
      ),
    ]);
  });

  it("tells Simplified from Traditional Chinese, and Japanese from both", () => {
    expect([failuresOf("zh-TW", thrice(SIMPLIFIED)), failuresOf("zh-CN", thrice(TRADITIONAL)), failuresOf("ja", thrice(SIMPLIFIED))]).toEqual([
      wholeAndEachParagraph(
        "reads as zh-CN, not zh-TW: 36 characters of zh-CN that zh-TW does not have, and 0 the other way",
        "reads as zh-CN, not zh-TW: 12 characters of zh-CN that zh-TW does not have, and 0 the other way",
      ),
      wholeAndEachParagraph(
        "reads as zh-TW, not zh-CN: 36 characters of zh-TW that zh-CN does not have, and 0 the other way",
        "reads as zh-TW, not zh-CN: 12 characters of zh-TW that zh-CN does not have, and 0 the other way",
      ),
      wholeAndEachParagraph(
        "reads as zh-CN, not ja: 36 characters of zh-CN that ja does not have, and 0 the other way",
        "reads as zh-CN, not ja: 12 characters of zh-CN that ja does not have, and 0 the other way",
      ),
    ]);
  });

  it("fails an article with none of its locale's common words, whatever language it is", () => {
    expect(failuresOf("de", [NO_LANGUAGE])).toEqual([
      "ada: the text as a whole does not read as de: 0.0% of its 121 words are common in de, the least is 8%",
    ]);
  });
});

describe("the language rule, on one leaf", () => {
  it("fails one long French paragraph inside a German article, and passes the article as a whole", () => {
    expect(failuresOf("de", [GERMAN, FRENCH, GERMAN, GERMAN])).toEqual([
      "ada sections[0].paragraphs[1]: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
    ]);
  });

  it("does not read a short leaf by itself, so a quoted French title passes in a German article", () => {
    expect(failuresOf("de", [GERMAN, SHORT_FRENCH, GERMAN, GERMAN])).toEqual([]);
  });

  it("does not read an article of under 100 words as a whole", () => {
    expect(failuresOf("de", [SHORT_FRENCH])).toEqual([]);
  });
});

describe("the language rule, on the strings of the section", () => {
  const strings = (text: string) => Object.fromEntries(thrice(text).map((value, index) => [`list.about${index}`, value]));

  it("fails French strings in the German locale as a whole, and passes German ones", () => {
    expect([failuresOf("de", thrice(GERMAN), strings(GERMAN)), failuresOf("de", thrice(GERMAN), strings(FRENCH))]).toEqual([
      [],
      [
        "chrome: the text as a whole reads as fr, not de: 63 words of fr that de does not have, and 0 the other way",
        "chrome list.about0: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
        "chrome list.about1: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
        "chrome list.about2: reads as fr, not de: 21 words of fr that de does not have, and 0 the other way",
      ],
    ]);
  });
});

describe("the language rule and a new locale", () => {
  it("fails a locale that has no language rule and is not told by its script alone", () => {
    expect(failuresOf("ca", thrice(GERMAN))).toEqual(["ca: no language rule, add one to scripts/articles-i18n/language.mjs"]);
  });
});

describe("verify, when the approved files of one locale are copied over another's", () => {
  const SLUGS = ["adriaan-de-groot", "judit-polgar", "magnus-carlsen"];
  const DIR = "src/lib/articles/translations";

  function shapesAfterCopying(from: string, into: string): { status: number | null; shapes: string[] } {
    return inSandbox("real", (root) => {
      setTranslatedLocales(root, ["en", into]);
      SLUGS.forEach((slug) => cpSync(join(root, DIR, from, `${slug}.json`), join(root, DIR, into, `${slug}.json`)));
      const run = runLever(root, "verify");
      const shapes = run.failures.map((line) => line.replace(/\d+/g, "N").replace(/ (description|drill\.why|(sections|sources)\[N\]\.\S+):/, " <leaf>:").replace(new RegExp(SLUGS.join("|")), "<slug>"));
      return { status: run.status, shapes: [...new Set(shapes)].sort() };
    });
  }

  it("fails the French articles in the German directory: not approved there, and not German", () => {
    expect(shapesAfterCopying("fr", "de")).toEqual({
      status: 1,
      shapes: [
        "[de] <slug> <leaf>: reads as fr, not de: N words of fr that de does not have, and N the other way",
        "[de] <slug>: not reviewed, the approval is for another text, article or locale",
        "[de] <slug>: the text as a whole reads as fr, not de: N words of fr that de does not have, and N the other way",
      ],
    });
  });

  it("fails the Simplified Chinese articles in the Traditional Chinese directory", () => {
    expect(shapesAfterCopying("zh-CN", "zh-TW")).toEqual({
      status: 1,
      shapes: [
        "[zh-TW] <slug> <leaf>: reads as zh-CN, not zh-TW: N characters of zh-CN that zh-TW does not have, and N the other way",
        "[zh-TW] <slug>: not reviewed, the approval is for another text, article or locale",
        "[zh-TW] <slug>: the text as a whole reads as zh-CN, not zh-TW: N characters of zh-CN that zh-TW does not have, and N the other way",
      ],
    });
  });
});
