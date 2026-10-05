import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  approvalHashOf,
  shapeProblems,
  sourceHashOf,
  textOf,
  translationProblems,
  withText,
} from "@/lib/articles/articleText";
import magnusCarlsen from "@/lib/articles/entries/magnus-carlsen";
import type { ArticleText } from "@/lib/articles/schema";
import { makeArticle, markEveryString } from "./fixtures";

const SHA256_HEX = /^[0-9a-f]{64}$/;
const ARTICLES_DIR = join(process.cwd(), "src/lib/articles");

const english = makeArticle(0);
const englishText: ArticleText = {
  title: "How Alder rebuilt a board from memory",
  description:
    "Alder looked at a position for a few seconds and rebuilt it. This fixture says how Alder ran the test and what it showed about recall.",
  person: { name: "Alder Fixture", role: "Fixture champion 1" },
  photo: {
    alt: "Alder Fixture at a chess board",
    author: "Fixture Photographer",
    license: "CC BY 4.0",
    changes: "Cropped and resized",
  },
  facts: {
    born: "1 Jan 1900, Alder Town",
    country: "Alderland",
    knownFor: "Alder openings",
    memoryFeat: "Alder blindfold display",
  },
  drill: { why: "Five seconds and twelve pieces match the test this fixture describes." },
  sections: english.sections,
  sources: [
    { title: "Alder source one", note: "Supports: the first Alder claim about recall." },
    { title: "Alder source two", note: "Supports: the second Alder claim about recall." },
    { title: "Alder source three", note: "Supports: the third Alder claim about recall." },
  ],
};
const german = markEveryString(englishText, "DE ");

describe("textOf", () => {
  it("keeps the words of an article and none of its language-neutral fields", () => {
    expect(textOf(english)).toStrictEqual(englishText);
  });
});

describe("withText", () => {
  const translated = withText(english, german);

  it("gives back the same article when the text is its own", () => {
    expect(withText(english, englishText)).toStrictEqual(english);
  });

  it("replaces every word with the translation", () => {
    expect(textOf(translated)).toStrictEqual(german);
    expect(translated.title).toBe("DE How Alder rebuilt a board from memory");
    expect(translated.sections[3].paragraphs[2]).toBe(
      "DE Alder wrote paragraph 3 for Alder section 4 on Alder recall. Only Alder tells part 4 of the Alder story in Alder passage 3.",
    );
    expect(translated.photo.changes).toBe("DE Cropped and resized");
  });

  it("keeps the slug, the dates, the photo file, the drill numbers and the source links", () => {
    expect(translated.slug).toBe("alder-fixture");
    expect(translated.publishedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(translated.updatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(translated.photo).toMatchObject({
      src: "/images/articles/magnus-carlsen.jpg",
      width: 840,
      height: 1050,
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fixture.jpg",
    });
    expect(translated.drill).toStrictEqual({
      pieceCount: 12,
      memorizeTime: 5,
      why: "DE Five seconds and twelve pieces match the test this fixture describes.",
    });
    expect(translated.sources.map((source) => source.url)).toEqual([
      "https://example.com/alder/one",
      "https://example.com/alder/two",
      "https://example.com/alder/three",
    ]);
  });
});

describe("sourceHashOf", () => {
  it("is the sha256 of the JSON with keys in sorted order", () => {
    expect(sourceHashOf({ a: 1, b: [{ c: "x", d: "y" }] })).toBe(
      "cf8715376709cfbee1fc74984a4ddf50d23ae461b490191c9f4ae780526b4f8b",
    );
  });

  it("does not depend on the order the keys were written in", () => {
    const reordered = { b: [{ d: "y", c: "x" }], a: 1 };

    expect(sourceHashOf(reordered)).toBe("cf8715376709cfbee1fc74984a4ddf50d23ae461b490191c9f4ae780526b4f8b");
  });

  it("depends on the order of a list", () => {
    expect(sourceHashOf(["x", "y"])).not.toBe(sourceHashOf(["y", "x"]));
  });

  it("changes when one character of the text changes", () => {
    const edited = { ...englishText, drill: { why: englishText.drill.why.replace("twelve", "twelvE") } };

    expect(sourceHashOf(englishText)).toMatch(SHA256_HEX);
    expect(sourceHashOf(edited)).toMatch(SHA256_HEX);
    expect(sourceHashOf(edited)).not.toBe(sourceHashOf(englishText));
  });

  it("gives plain Node, loading the TypeScript files as they are, the hash Jest computes", () => {
    const moduleUrl = pathToFileURL(join(ARTICLES_DIR, "articleText.ts")).href;
    const entryUrl = pathToFileURL(join(ARTICLES_DIR, "entries/magnus-carlsen.ts")).href;
    const program = `import { sourceHashOf, textOf } from ${JSON.stringify(moduleUrl)}; import entry from ${JSON.stringify(entryUrl)}; process.stdout.write(sourceHashOf(textOf(entry)));`;

    const fromNode = execFileSync(process.execPath, ["--input-type=module", "--eval", program], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    expect(fromNode).toMatch(SHA256_HEX);
    expect(fromNode).toBe(sourceHashOf(textOf(magnusCarlsen)));
  });
});

describe("approvalHashOf", () => {
  const unit = {
    sourceHash: "abc",
    sameAsEnglish: ["facts.country"],
    text: { title: "Titel", sections: [{ heading: "Zehn Bretter" }] },
  };
  const HASH = "45760e975b86210a3c7b73a6ef9f2a22731b97284b361f20fe57695d6802e8fb";

  it("is the hash of the text, the paths kept in English and the hash of the English source", () => {
    expect(approvalHashOf(unit)).toBe(HASH);
  });

  it("ignores every other key of a file and the order of the keys", () => {
    const file = {
      approvedHash: "old",
      text: { sections: [{ heading: "Zehn Bretter" }], title: "Titel" },
      sourceHash: "abc",
      sameAsEnglish: ["facts.country"],
    };

    expect(approvalHashOf(file)).toBe(HASH);
  });

  it.each([
    ["one character of the text", { ...unit, text: { ...unit.text, title: "Titel." } }],
    ["a path kept in English", { ...unit, sameAsEnglish: ["facts.country", "facts.title"] }],
    ["the English source", { ...unit, sourceHash: "abd" }],
  ])("changes with %s", (_, changed) => {
    expect(approvalHashOf(changed)).toMatch(SHA256_HEX);
    expect(approvalHashOf(changed)).not.toBe(HASH);
  });
});

describe("shapeProblems", () => {
  it("finds nothing wrong with a text of the same shape", () => {
    expect(shapeProblems(englishText, german)).toEqual([]);
  });

  it("names a missing key and a key the English text does not have", () => {
    const { country, ...factsWithoutCountry } = german.facts;
    const candidate = { ...german, facts: { ...factsWithoutCountry, died: `${country} 1990` } };

    expect(shapeProblems(englishText, candidate)).toEqual([
      "facts.country: missing",
      "facts.died: not in the English text",
    ]);
  });

  it("names a list of the wrong length", () => {
    const candidate = {
      ...german,
      sections: german.sections.map((section, index) =>
        index === 2 ? { ...section, paragraphs: section.paragraphs.slice(0, 2) } : section,
      ),
      sources: german.sources.slice(0, 2),
    };

    expect(shapeProblems(englishText, candidate)).toEqual([
      "sections[2].paragraphs: 2 items where the English text has 3",
      "sources: 2 items where the English text has 3",
    ]);
  });

  it("names an empty leaf, a padded leaf and a leaf that is not a string", () => {
    const candidate = {
      ...german,
      title: "",
      person: { name: " Erle Fixture", role: 7 },
      sources: german.sources.map((source, index) => (index === 0 ? { ...source, note: "   " } : source)),
    };

    expect(shapeProblems(englishText, candidate)).toEqual([
      "title: empty",
      "person.name: leading or trailing space",
      "person.role: not a string",
      "sources[0].note: empty",
    ]);
  });

  it("names a list or an object that is something else", () => {
    const candidate = { ...german, facts: "DE facts", sections: { heading: "DE heading" } };

    expect(shapeProblems(englishText, candidate)).toEqual(["facts: not an object", "sections: not a list"]);
  });

  it("starts every path at the prefix it is given", () => {
    expect(shapeProblems(englishText, { ...german, title: "" }, "text")).toEqual(["text.title: empty"]);
    expect(shapeProblems(englishText, null)).toEqual(["(root): not an object"]);
  });
});

describe("translationProblems", () => {
  const unit = { sourceHash: sourceHashOf(englishText), sameAsEnglish: [], text: german };
  const file = { ...unit, approvedHash: approvalHashOf(unit) };
  const EDITED = ["not reviewed, edited after it was approved"];

  it("accepts a translation made from the current English text and approved as it stands", () => {
    expect(translationProblems(file, englishText)).toEqual([]);
  });

  it("rejects a translation whose text, or list of paths kept in English, changed after it was approved", () => {
    const retitled = { ...file, text: { ...german, title: "DE Wie Alder ein Brett nachbaute" } };

    expect(translationProblems(retitled, englishText)).toEqual(EDITED);
    expect(translationProblems({ ...file, sameAsEnglish: ["facts.country"] }, englishText)).toEqual(EDITED);
    expect(translationProblems({ ...file, approvedHash: "0".repeat(64) }, englishText)).toEqual(EDITED);
  });

  it("rejects a key the lever does not write, so a reviewed flag written by hand is an error", () => {
    expect(translationProblems({ ...file, reviewed: true }, englishText)).toEqual(['unknown key "reviewed"']);
    expect(translationProblems({ ...unit, reviewed: true, note: "ok" }, englishText)).toEqual([
      'unknown key "reviewed"',
      'unknown key "note"',
      "not reviewed",
    ]);
  });

  it("rejects a translation made from an older English text", () => {
    const edited = { ...englishText, title: "How Alder rebuilt a board from memory in 1946" };

    expect(translationProblems(file, edited)).toEqual(["sourceHash is stale"]);
  });

  it("rejects a translation nobody reviewed", () => {
    expect(translationProblems({ ...file, approvedHash: null }, englishText)).toEqual(["not reviewed"]);
    expect(translationProblems(unit, englishText)).toEqual(["not reviewed"]);
  });

  it("lists every problem of a file at once", () => {
    const broken = { sourceHash: "0".repeat(64), approvedHash: null, text: { ...german, title: "" } };

    expect(translationProblems(broken, englishText)).toEqual([
      "text.title: empty",
      "sourceHash is stale",
      "not reviewed",
    ]);
  });

  it("rejects a file that is not a translation at all", () => {
    expect(translationProblems(null, englishText)).toEqual(["the file is not an object"]);
    expect(translationProblems({ sourceHash: file.sourceHash, approvedHash: null }, englishText)).toEqual([
      "text: not an object",
      "not reviewed",
    ]);
  });
});
