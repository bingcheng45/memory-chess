/** @jest-environment node */

import type { ArticleText } from "@/lib/articles/schema";
import {
  ADA,
  BEN,
  FIXTURE_CHROME,
  inRussian,
  inSandbox,
  exportedEnglish,
  marked,
  put,
  putEnglishChrome,
  putEntry,
  runLever,
  writeTranslation,
  type LeverRun,
  type Translation,
} from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const DIR = "work/candidate";
const PASS = { status: 0, failures: [] };
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
const COMBINING_ACUTE = String.fromCharCode(0x301);

type Build = (english: Translation) => Partial<Translation>;

function check(locale: string, build: Build): LeverRun {
  return inSandbox("fixture", (root) => {
    writeTranslation(root, DIR, build(exportedEnglish(root)));
    return runLever(root, "check", locale, DIR);
  });
}

function withText(translation: Translation, change: (ada: ArticleText) => unknown): Translation {
  const ada = change(translation.articles[ADA.slug]) as ArticleText;
  return { ...translation, articles: { ...translation.articles, [ADA.slug]: ada } };
}

function withChrome(translation: Translation, key: string, value: string): Translation {
  return { ...translation, chrome: { ...translation.chrome, [key]: value } };
}

const withFirstParagraph = (ada: ArticleText, paragraph: string): ArticleText => ({
  ...ada,
  sections: [{ ...ada.sections[0], paragraphs: [paragraph, ada.sections[0].paragraphs[1]] }],
});

describe("a translation that keeps every rule", () => {
  it("passes for a language with Latin letters and prints a line that starts with ok", () => {
    const run = check("de", marked);

    expect(run).toEqual({ ...PASS, stdout: "ok check de: 2 articles and 5 chrome strings pass in work/candidate\n" });
  });

  it("passes for Russian with Cyrillic text and four plural forms", () => {
    const run = check("ru", inRussian);

    expect(run).toEqual({ ...PASS, stdout: "ok check ru: 2 articles and 5 chrome strings pass in work/candidate\n" });
  });
});

describe("check 1: the locale", () => {
  it.each([
    ["a locale the site does not ship", ["check", "xx", DIR], '"xx"'],
    ["English on check", ["check", "en", DIR], '"en"'],
    ["English on import", ["import", "en", DIR], '"en"'],
    ["English on approve", ["approve", "en"], '"en"'],
  ])("refuses %s as a usage error", (_, args, named) => {
    const run = inSandbox("fixture", (root) => {
      writeTranslation(root, DIR, marked(exportedEnglish(root)));
      return runLever(root, ...args);
    });

    expect(run).toEqual({
      status: 2,
      stdout: "",
      failures: [`articles-i18n: ${named} is not a shipped locale other than en`],
    });
  });
});

describe("check 2: one file for each article and for the chrome", () => {
  it("names a missing article, a missing chrome file and a file for no article", () => {
    const run = check("de", (english) => {
      const good = marked(english);
      return { articles: { [ADA.slug]: good.articles[ADA.slug], "carl-example": good.articles[BEN.slug] } };
    });

    expect(run).toEqual({
      status: 1,
      stdout: "check de: 3 failures in work/candidate\n",
      failures: ["ben-example: no file", "carl-example: no English article has this slug", "chrome: no file"],
    });
  });

  it("names a file that is not JSON", () => {
    const run = inSandbox("fixture", (root) => {
      writeTranslation(root, DIR, marked(exportedEnglish(root)));
      put(root, `${DIR}/${ADA.slug}.json`, "{ not json");
      return runLever(root, "check", "de", DIR);
    });

    expect(run.status).toBe(1);
    expect(run.failures).toHaveLength(1);
    expect(run.failures[0]).toMatch(/^ada-example: not valid JSON, /);
  });
});

describe("check 3: the shape of an article", () => {
  it("fails on a dropped paragraph, an empty leaf and a key English does not have", () => {
    const run = check("de", (english) =>
      withText(marked(english), (ada) => ({
        ...ada,
        facts: { ...ada.facts, country: " ", died: "Zz 2020" },
        sections: [{ ...ada.sections[0], paragraphs: [ada.sections[0].paragraphs[0]] }],
      })),
    );

    expect(run.status).toBe(1);
    expect(run.failures).toEqual([
      "ada-example facts.country: empty",
      "ada-example facts.died: not in the English text",
      "ada-example sections[0].paragraphs: 1 items where the English text has 2",
    ]);
  });
});

describe("check 4: the chrome strings", () => {
  it("fails on a missing key and on a key English does not have", () => {
    const run = check("de", (english) => {
      const { "pager.page": page, ...rest } = marked(english).chrome;
      return { ...marked(english), chrome: { ...rest, "pager.seite": page } };
    });

    expect(run.failures).toEqual(["chrome pager.page: missing", "chrome pager.seite: not in the English text"]);
  });

  it.each([
    ["a renamed placeholder", "pager.page", "Seite {seite}", "placeholders are {seite}, the English text has {page}"],
    ["a dropped placeholder", "pager.page", "Seite", "placeholders are none, the English text has {page}"],
    [
      "a renamed tag",
      "list.corrections",
      "Etwas falsch? <a>Korrektur senden</a>.",
      "tags are <a>, the English text has <link>",
    ],
    ["a plural turned into a plain number", "counts.views", "{count} Aufrufe", "{count} must stay a plural"],
    ["a message that does not compile", "pager.page", "Seite {page", "ICU error, EXPECT_ARGUMENT_CLOSING_BRACE"],
    ["a value with a space at the end", "list.heading", "Artikel ", "leading or trailing space"],
  ])("fails on %s", (_, key, value, reason) => {
    const run = check("de", (english) => withChrome(marked(english), key, value));

    expect(run).toEqual({
      status: 1,
      stdout: "check de: 1 failure in work/candidate\n",
      failures: [`chrome ${key}: ${reason}`],
    });
  });

  it("fails a Russian plural that has only the two English forms, and names the missing ones", () => {
    const run = check("ru", (english) =>
      withChrome(inRussian(english), "counts.views", "{count, plural, one {# просмотр} other {# просмотров}}"),
    );

    expect(run.failures).toEqual([
      "chrome counts.views: plural {count} is missing few, many (ru needs one, few, many, other)",
    ]);
  });
});

describe("check 5: numbers", () => {
  it("fails the leaf whose year was changed", () => {
    const run = check("de", (english) =>
      withText(marked(english), (ada) => withFirstParagraph(ada, ada.sections[0].paragraphs[0].replace("2012", "2013"))),
    );

    expect(run.failures).toEqual(["ada-example sections[0].paragraphs[0]: the number 2012 of the English text is missing"]);
  });
});

describe("check 6: a value identical to the English one", () => {
  const IDENTICAL = "identical to the English text, list the path in sameAsEnglish if that is right";
  const leftInEnglish: Build = (english) =>
    withChrome(
      withText(marked(english), (ada) => ({ ...ada, facts: { ...ada.facts, country: "Norway" } })),
      "list.heading",
      "Articles",
    );

  it("fails in an article and in the chrome", () => {
    const run = check("de", leftInEnglish);

    expect(run.failures).toEqual([`ada-example facts.country: ${IDENTICAL}`, `chrome list.heading: ${IDENTICAL}`]);
  });

  it("passes once both paths are listed in same-as-english.json", () => {
    const run = check("de", (english) => ({
      ...leftInEnglish(english),
      sameAsEnglish: { chrome: ["list.heading"], [ADA.slug]: ["facts.country"] },
    }));

    expect(run).toMatchObject(PASS);
  });

  it("fails a listed path that differs from English, one that does not exist, and a key that is no article", () => {
    const run = check("de", (english) => ({
      ...marked(english),
      sameAsEnglish: { [ADA.slug]: ["facts.born", "facts.nope"], "carl-example": ["title"] },
    }));

    expect(run.failures).toEqual([
      'same-as-english.json: "carl-example" is neither chrome nor an article',
      "ada-example facts.born: listed in sameAsEnglish but differs from the English text",
      "ada-example facts.nope: listed in sameAsEnglish but the English text has no such path",
    ]);
  });
});

describe("check 7: source titles and CC licences", () => {
  it("fails a translated source title and a changed CC licence name", () => {
    const run = check("de", (english) =>
      withText(marked(english), (ada) => ({
        ...ada,
        photo: { ...ada.photo, license: "CC BY 4.0 International" },
        sources: [{ ...ada.sources[0], title: "Denken und Wahl im Schach" }],
      })),
    );

    expect(run.failures).toEqual([
      "ada-example photo.license: a CC licence must stay exactly as in the English text",
      "ada-example sources[0].title: a source title must stay exactly as in the English text",
    ]);
  });
});

describe("check 8: long dashes", () => {
  it.each([
    ["an em dash", EM_DASH],
    ["an en dash", EN_DASH],
  ])("fails on %s", (_, dash) => {
    const run = check("de", (english) => withText(marked(english), (ada) => ({ ...ada, drill: { why: `${ada.drill.why} ${dash} Zz` } })));

    expect(run.failures).toEqual(["ada-example drill.why: has an em dash or an en dash"]);
  });
});

describe("check 9: the title length", () => {
  it("fails a title of 91 characters", () => {
    const run = check("de", (english) => withText(marked(english), (ada) => ({ ...ada, title: "Z".repeat(91) })));

    expect(run.failures).toEqual(["ada-example title: 91 characters, the limit is 90"]);
  });

  it("counts a letter with a combining mark as one character", () => {
    const run = check("de", (english) =>
      withText(marked(english), (ada) => ({ ...ada, title: `e${COMBINING_ACUTE}`.repeat(90) })),
    );

    expect(run).toMatchObject(PASS);
  });
});

describe("check 10: the name Memory Chess", () => {
  it("fails a leaf that lost it, in an article and in the chrome", () => {
    const run = check("de", (english) =>
      withChrome(
        withText(marked(english), (ada) => ({ ...ada, drill: { why: "Zz Five seconds is enough for 12 pieces." } })),
        "list.about",
        "Zz Each drill opens a round.",
      ),
    );

    expect(run.failures).toEqual([
      'ada-example drill.why: "Memory Chess" is missing',
      'chrome list.about: "Memory Chess" is missing',
    ]);
  });
});

describe("check 11: angle brackets", () => {
  it("fails an article leaf that has one", () => {
    const run = check("de", (english) =>
      withText(marked(english), (ada) => ({ ...ada, sections: [{ ...ada.sections[0], heading: "Zz <b>Ten</b> boards" }] })),
    );

    expect(run.failures).toEqual(["ada-example sections[0].heading: has < or >"]);
  });
});

describe("check 12: the script of a language that does not use Latin letters", () => {
  it("fails a long Russian leaf that is still in Latin letters", () => {
    const run = check("ru", (english) =>
      withText(inRussian(english), (ada) => withFirstParagraph(ada, marked(english).articles[ADA.slug].sections[0].paragraphs[0])),
    );

    expect(run.failures).toEqual([
      "ada-example sections[0].paragraphs[0]: 0 of 72 letters are Cyrillic, at least half must be",
    ]);
  });
});

describe("check 13: installed files made from an older English text", () => {
  const STALE = "sourceHash is stale, the English text changed after this translation was made";

  it("fails the article and the chrome whose English source changed, and nothing else", () => {
    const run = inSandbox("fixture", (root) => {
      writeTranslation(root, DIR, marked(exportedEnglish(root)));
      runLever(root, "import", "de", DIR);
      const before = runLever(root, "check", "de");
      putEntry(root, { ...ADA, drill: { ...ADA.drill, why: `${ADA.drill.why} Try it.` } });
      putEnglishChrome(root, { ...FIXTURE_CHROME, pager: { page: "Page number {page}" } });
      return { before, after: runLever(root, "check", "de") };
    });

    expect(run.before).toEqual({
      ...PASS,
      stdout: "ok check de: 2 articles and 5 chrome strings pass in the installed files\n",
    });
    expect(run.after).toEqual({
      status: 1,
      stdout: "check de: 2 failures in the installed files\n",
      failures: [`ada-example: ${STALE}`, `chrome: ${STALE}`],
    });
  });
});

describe("check 14: a full stop the English text does not end with", () => {
  it("fails a leaf that gained one, in an article and in the chrome", () => {
    const run = check("de", (english) =>
      withChrome(
        withText(marked(english), (ada) => ({ ...ada, photo: { ...ada.photo, changes: "Zz Cropped." } })),
        "list.heading",
        "Zz Articles.",
      ),
    );

    expect(run.failures).toEqual([
      "ada-example photo.changes: ends with a full stop, the English text does not",
      "chrome list.heading: ends with a full stop, the English text does not",
    ]);
  });
});
