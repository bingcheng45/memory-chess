/** @jest-environment node */

import { existsSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { ARTICLES, ARTICLE_SLUGS } from "@/lib/articles";
import { sourceHashOf, textOf } from "@/lib/articles/articleText";
import {
  ADA,
  FIXTURE_CHROME,
  GERMAN_DIR as DIR,
  INSTALLED_GERMAN as INSTALLED,
  SOURCE_DIR,
  exportedEnglish,
  filesUnder,
  importGerman,
  inSandbox,
  marked,
  put,
  putJson,
  read,
  readJson,
  runLever,
  withSecondParagraph,
  writeTranslation,
} from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const USAGE = `Usage: node scripts/articles-i18n.mjs <command>

  export <outDir>          write the English sources a translator works from
  check <locale> [dir]     check a translator's directory, or the installed files when no dir is given
  import <locale> <dir>    check a directory, then install it, not yet approved
  approve <locale>         check the installed files, then record the hash of the text as approved
  seed                     give every locale without a translation the English chrome strings
  verify                   check every locale that serves articles and require the approval of its text as it stands

Run it from the repo root. Every path must stay inside the repo.
`;

function withOutsideDir<T>(body: (outside: string) => T): T {
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "articles-i18n-outside-")));
  try {
    return body(outside);
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
}

describe("export", () => {
  it("writes one source file for each entry of the registry, with the hash of its English text", () => {
    const exported = inSandbox("real", (root) => {
      const run = runLever(root, "export", SOURCE_DIR);
      return { run, files: filesUnder(root, SOURCE_DIR) };
    });

    expect(exported.run.failures).toEqual([]);
    expect(exported.run.status).toBe(0);
    expect(Object.keys(exported.files).sort()).toEqual(
      [`${SOURCE_DIR}/chrome.source.json`, ...ARTICLE_SLUGS.map((slug) => `${SOURCE_DIR}/${slug}.source.json`)].sort(),
    );
    ARTICLES.forEach((article) => {
      expect(JSON.parse(exported.files[`${SOURCE_DIR}/${article.slug}.source.json`])).toEqual({
        slug: article.slug,
        sourceHash: sourceHashOf(textOf(article)),
        text: textOf(article),
      });
    });
  });

  it("lists every chrome string, and names placeholders, tags and plural arguments only where a string has some", () => {
    const exported = inSandbox("fixture", (root) => {
      const run = runLever(root, "export", SOURCE_DIR);
      return { run, chrome: readJson(root, `${SOURCE_DIR}/chrome.source.json`) };
    });

    expect(exported.run).toEqual({
      status: 0,
      stdout: "ok export: 2 articles and 5 chrome strings in work/source\n",
      failures: [],
    });
    expect(exported.chrome).toEqual({
      sourceHash: sourceHashOf(FIXTURE_CHROME),
      strings: [
        { key: "list.heading", english: "Articles" },
        { key: "list.about", english: "Each drill opens a round of Memory Chess." },
        { key: "list.corrections", english: "If something is wrong, <link>send a correction</link>.", tags: ["link"] },
        { key: "pager.page", english: "Page {page}", placeholders: ["page"] },
        {
          key: "counts.views",
          english: "{count, plural, one {# view} other {# views}}",
          placeholders: ["count"],
          plurals: ["count"],
        },
      ],
    });
  });

  it("leaves every byte as it was on a second run", () => {
    const runs = inSandbox("fixture", (root) => {
      runLever(root, "export", SOURCE_DIR);
      const first = filesUnder(root, SOURCE_DIR);
      runLever(root, "export", SOURCE_DIR);
      return { first, second: filesUnder(root, SOURCE_DIR) };
    });

    expect(Object.keys(runs.first)).toHaveLength(3);
    expect(runs.second).toEqual(runs.first);
  });
});

describe("import", () => {
  it("writes each article with its hash and no approval, and the chrome strings under articles only", () => {
    const state = inSandbox("fixture", (root) => {
      const run = importGerman(root);
      return {
        run,
        installed: readdirSync(join(root, INSTALLED)).sort(),
        ada: readJson(root, `${INSTALLED}/ada-example.json`),
        chrome: readJson(root, `${INSTALLED}/chrome.json`),
        messages: read(root, "messages/de.json"),
        russian: readJson(root, "messages/ru.json"),
      };
    });

    expect(state.run).toEqual({ status: 0, stdout: "ok import de: 4 files written, 0 unchanged\n", failures: [] });
    expect(state.installed).toEqual(["ada-example.json", "ben-example.json", "chrome.json"]);
    expect(Object.keys(state.ada)).toEqual(["sourceHash", "approvedHash", "sameAsEnglish", "text"]);
    expect(state.ada).toMatchObject({ sourceHash: sourceHashOf(textOf(ADA)), approvedHash: null, sameAsEnglish: [] });
    expect(state.ada.text.title).toBe("Howz Adaz Examplez recallsz az boardz");
    expect(state.ada.text.sections[0].paragraphs[1]).toBe("Shez wonz everyz gamez.");
    expect(state.ada.text.sources).toEqual([
      { title: "Thought and Choice in Chess", note: "Thez 1965 bookz thatz describesz thez recallz experimentz." },
    ]);
    expect(state.chrome).toEqual({ sourceHash: sourceHashOf(FIXTURE_CHROME), approvedHash: null, sameAsEnglish: [] });
    expect(state.messages).toBe(`{
  "common": {
    "play": "Play in de"
  },
  "articles": {
    "list": {
      "heading": "Articlesz",
      "about": "Eachz drillz opensz az roundz ofz Memory Chess.",
      "corrections": "Ifz somethingz isz wrongz, <link>sendz az correctionz</link>."
    },
    "pager": {
      "page": "Pagez {page}"
    },
    "counts": {
      "views": "{count, plural, one {# viewz} other {# viewsz}}"
    }
  },
  "home": {
    "title": "Home in de"
  }
}
`);
    expect(state.russian.articles).toEqual(FIXTURE_CHROME);
  });

  it("changes no byte of the real German catalogue outside the articles key", () => {
    const ARTICLES_KEY = '\n  "articles": {';
    const state = inSandbox("real", (root) => {
      const before = read(root, "messages/de.json");
      const run = importGerman(root);
      const after = read(root, "messages/de.json");
      runLever(root, "import", "de", DIR);
      return { run, before, after, check: runLever(root, "check", "de"), again: read(root, "messages/de.json") };
    });
    const articlesAt = state.before.indexOf(ARTICLES_KEY);

    expect(state.run.failures).toEqual([]);
    expect(state.check.failures).toEqual([]);
    expect(state.check.status).toBe(0);
    expect(articlesAt).toBeGreaterThan(1000);
    expect(state.after.slice(0, articlesAt + ARTICLES_KEY.length)).toBe(state.before.slice(0, articlesAt + ARTICLES_KEY.length));
    expect(state.after).not.toBe(state.before);
    expect(state.after.endsWith("\n  }\n}\n")).toBe(true);
    expect(JSON.parse(state.after).articles.list.heading).toBe("Articlesz");
    expect(state.again).toBe(state.after);
  });

  it("leaves every byte as it was on a second run", () => {
    const runs = inSandbox("fixture", (root) => {
      importGerman(root);
      const first = { ...filesUnder(root, "src"), ...filesUnder(root, "messages") };
      const run = runLever(root, "import", "de", DIR);
      return { run, first, second: { ...filesUnder(root, "src"), ...filesUnder(root, "messages") } };
    });

    expect(runs.run.stdout).toBe("ok import de: 0 files written, 4 unchanged\n");
    expect(runs.second).toEqual(runs.first);
  });

  it("writes nothing when the check fails", () => {
    const state = inSandbox("fixture", (root) => {
      const before = filesUnder(root, "messages");
      const run = importGerman(root, (good) => withSecondParagraph(good, "She won every game."));
      return { run, before, after: filesUnder(root, "messages"), hasInstalled: existsSync(join(root, INSTALLED)) };
    });

    expect(state.run).toEqual({
      status: 1,
      stdout: "import de: 1 failure in work/de, nothing was written\n",
      failures: [
        "ada-example sections[0].paragraphs[1]: identical to the English text, list the path in sameAsEnglish if that is right",
      ],
    });
    expect(state.hasInstalled).toBe(false);
    expect(state.after).toEqual(state.before);
  });

  it("refuses a catalogue whose formatting a merge would change", () => {
    const state = inSandbox("fixture", (root) => {
      put(root, "messages/de.json", JSON.stringify(readJson(root, "messages/de.json")));
      return { run: importGerman(root), hasInstalled: existsSync(join(root, INSTALLED)) };
    });

    expect(state.run.status).toBe(2);
    expect(state.run.failures).toEqual([
      "articles-i18n: messages/de.json is not formatted as JSON.stringify(value, null, 2) plus a newline, so a merge would rewrite lines outside articles",
    ]);
    expect(state.hasInstalled).toBe(false);
  });
});

describe("seed", () => {
  it("changes nothing on the layout of this repo", () => {
    const state = inSandbox("real", (root) => {
      const before = filesUnder(root, "messages");
      const run = runLever(root, "seed");
      return { run, before, after: filesUnder(root, "messages") };
    });

    expect(state.run.failures).toEqual([]);
    expect(state.run.stdout).toMatch(/^ok seed: 0 files changed, /);
    expect(Object.keys(state.before).length).toBeGreaterThan(20);
    expect(state.after).toEqual(state.before);
  });

  it("gives a locale without a translation the English strings and leaves a translated locale alone", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      putJson(root, "messages/ru.json", { ...readJson(root, "messages/ru.json"), articles: { list: { heading: "Old" } } });
      const run = runLever(root, "seed");
      return { run, german: readJson(root, "messages/de.json"), russian: read(root, "messages/ru.json") };
    });

    expect(state.run).toEqual({
      status: 0,
      stdout: "ok seed: 1 file changed, 1 untranslated locale\n",
      failures: [],
    });
    expect(state.german.articles.list.heading).toBe("Articlesz");
    expect(JSON.parse(state.russian)).toEqual({
      common: { play: "Play in ru" },
      articles: FIXTURE_CHROME,
      home: { title: "Home in ru" },
    });
    expect(state.russian.endsWith('"title": "Home in ru"\n  }\n}\n')).toBe(true);
  });
});

describe("the command line", () => {
  it.each([
    ["no command", []],
    ["an unknown command", ["publish"]],
    ["a missing argument", ["import", "de"]],
    ["an extra argument", ["verify", "de"]],
  ])("prints the usage and exits 2 on %s", (_, args) => {
    const state = inSandbox("fixture", (root) => {
      const run = runLever(root, ...args);
      return { run, hasInstalled: existsSync(join(root, INSTALLED)) };
    });

    expect(state.run).toEqual({ status: 2, stdout: "", failures: USAGE.split("\n").filter((line) => line !== "") });
    expect(state.hasInstalled).toBe(false);
  });

  it("refuses a path outside the repo, given directly, with dots or through a symlink, and writes nothing there", () => {
    const state = withOutsideDir((outside) =>
      inSandbox("fixture", (root) => {
        writeTranslation(root, DIR, marked(exportedEnglish(root)));
        symlinkSync(outside, join(root, "link"));
        const dotted = `../${basename(outside)}`;
        return {
          dotted,
          runs: [
            runLever(root, "export", join(outside, "source")),
            runLever(root, "export", `${dotted}/source`),
            runLever(root, "export", "link/source"),
            runLever(root, "check", "de", dotted),
            runLever(root, "import", "de", "link"),
          ],
          written: readdirSync(outside),
          hasInstalled: existsSync(join(root, INSTALLED)),
        };
      }),
    );

    expect(state.runs.map((run) => run.status)).toEqual([2, 2, 2, 2, 2]);
    expect(state.runs.map((run) => run.stdout)).toEqual(["", "", "", "", ""]);
    expect(state.runs[1].failures).toEqual([`articles-i18n: ${state.dotted}/source is outside the repo`]);
    expect(state.runs[2].failures).toEqual(["articles-i18n: link/source is outside the repo"]);
    expect(state.written).toEqual([]);
    expect(state.hasInstalled).toBe(false);
  });

  it("refuses a directory that does not exist", () => {
    const run = inSandbox("fixture", (root) => runLever(root, "check", "de", "work/none"));

    expect(run).toEqual({ status: 2, stdout: "", failures: ["articles-i18n: work/none is not a directory"] });
  });

  it("refuses to run outside a repo root", () => {
    const run = withOutsideDir((outside) => runLever(outside, "verify"));

    expect(run).toEqual({
      status: 2,
      stdout: "",
      failures: ["articles-i18n: messages/en.json is missing, run this from the repo root"],
    });
  });
});
