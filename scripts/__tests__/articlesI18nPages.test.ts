/** @jest-environment node */

import { cpSync, mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sourceHashOf } from "@/lib/articles/articleText";
import about from "@/lib/pages/about";
import privacy from "@/lib/pages/privacy";
import readingChrome from "@/lib/pages/readingChrome";
import terms from "@/lib/pages/terms";
import { put, putJson, read, readJson, runLever } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const REPO_ROOT = join(__dirname, "..", "..");
const COPIED = [
  "src/i18n/routing.ts",
  "src/lib/articles/articleText.ts",
  "src/lib/articles/schema.ts",
  "src/lib/pages/translatedLocales.ts",
  "src/lib/pages/schema.ts",
  "src/lib/pages/about.ts",
  "src/lib/pages/privacy.ts",
  "src/lib/pages/terms.ts",
  "src/lib/pages/readingChrome.ts",
];
const ENGLISH = { about, privacy, terms, chrome: readingChrome };
const UNITS = Object.keys(ENGLISH);
const SOURCE_DIR = "work/source";
const DIR = "work/de";
const INSTALLED = "src/lib/pages/translations/de";
const LOCALES_FILE = "src/lib/pages/translatedLocales.ts";

type Texts = Record<string, Record<string, unknown>>;

function inPagesSandbox<T>(body: (root: string) => T): T {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "pages-i18n-")));
  try {
    COPIED.forEach((path) => cpSync(join(REPO_ROOT, path), join(root, path)));
    putJson(root, "package.json", { name: "sandbox", private: true });
    putJson(root, "messages/en.json", {});
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function servePagesIn(root: string, locales: readonly string[]): void {
  const source = read(root, LOCALES_FILE).replace(
    /TRANSLATED_PAGE_LOCALES: readonly Locale\[\] = \[\];/,
    `TRANSLATED_PAGE_LOCALES: readonly Locale[] = ${JSON.stringify(locales)};`,
  );
  put(root, LOCALES_FILE, source);
}

const GERMAN_WORDS = [
  "der",
  "und",
  "den",
  "von",
  "das",
  "mit",
  "sich",
  "des",
  "auf",
  "für",
  "ist",
  "dem",
  "nicht",
  "eine",
  "auch",
];
const ICU_SYNTAX_AND_BRAND = /(\{\w+(?:, plural,)?|\b(?:one|other) \{|<\/?\w+>|Memory Chess)/;

function inGerman(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(inGerman);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, inGerman(item)]));
  }
  let next = 0;
  const word = () => GERMAN_WORDS[next++ % GERMAN_WORDS.length];
  return String(value)
    .split(ICU_SYNTAX_AND_BRAND)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/\p{L}+/gu, word)))
    .join("");
}

// The checks read the language of the text, so this stand-in for German puts German function words in every place.
const german = (): Texts => inGerman(ENGLISH) as Texts;

function writeDir(root: string, texts: Readonly<Record<string, unknown>>): void {
  rmSync(join(root, DIR), { recursive: true, force: true });
  Object.entries(texts).forEach(([name, text]) => putJson(root, `${DIR}/${name}.json`, text));
}

function importGerman(root: string, change: (good: Texts) => Texts = (good) => good) {
  writeDir(root, change(german()));
  return runLever(root, "--pages", "import", "de", DIR);
}

function withPrivacyParagraph(good: Texts, paragraph: string | undefined): Texts {
  const sections = good.privacy.sections as Record<string, { title: string; blocks: { p?: string }[] }>;
  const shortVersion = sections["short-version"];
  const blocks = paragraph === undefined ? [] : [{ p: paragraph }];
  return {
    ...good,
    privacy: { ...good.privacy, sections: { ...sections, "short-version": { ...shortVersion, blocks } } },
  };
}

describe("--pages export", () => {
  it("writes the English text of each page and of the chrome, with its hash", () => {
    const files = inPagesSandbox((root) => {
      expect(runLever(root, "--pages", "export", SOURCE_DIR)).toEqual({
        status: 0,
        stdout: `ok export: 3 pages and the chrome in ${SOURCE_DIR}\n`,
        failures: [],
      });
      return readdirSync(join(root, SOURCE_DIR)).map((name) => readJson(root, `${SOURCE_DIR}/${name}`));
    });

    expect(files).toEqual(
      expect.arrayContaining(
        Object.entries(ENGLISH).map(([name, text]) => ({ name, sourceHash: sourceHashOf(text), text })),
      ),
    );
    expect(files).toHaveLength(UNITS.length);
  });
});

it("has no seed, so no English text is ever installed as a translation", () => {
  const run = inPagesSandbox((root) => runLever(root, "--pages", "seed"));

  expect(run.status).toBe(2);
  expect(run.stdout).toBe("");
});

describe("--pages check and import", () => {
  it("refuses the English text handed in as German", () => {
    const run = inPagesSandbox((root) => {
      writeDir(root, ENGLISH);
      return runLever(root, "--pages", "check", "de", DIR);
    });

    expect(run.status).toBe(1);
    expect(run.failures).toContain(
      "privacy title: identical to the English text, list the path in sameAsEnglish if that is right",
    );
    expect(run.failures).toContain(
      "chrome contents: identical to the English text, list the path in sameAsEnglish if that is right",
    );
  });

  it("installs a translation that passes, one file per unit, not yet approved", () => {
    const { run, installed } = inPagesSandbox((root) => {
      const run = importGerman(root);
      const installed = Object.fromEntries(UNITS.map((name) => [name, readJson(root, `${INSTALLED}/${name}.json`)]));
      return { run, installed };
    });

    expect(run).toEqual({ status: 0, stdout: "ok import de: 4 files written, 0 unchanged\n", failures: [] });
    expect(installed.privacy).toEqual({
      sourceHash: sourceHashOf(privacy),
      approvedHash: null,
      sameAsEnglish: [],
      text: german().privacy,
    });
  });

  it.each([
    [
      "a dropped paragraph",
      (good: Texts) => withPrivacyParagraph(good, undefined),
      "privacy sections.short-version.blocks: 0 items where the English text has 1",
    ],
    [
      "a link tag left out",
      (good: Texts) => {
        const sections = good.privacy.sections as Record<string, { blocks: { p: string }[] }>;
        const controller = {
          ...sections.controller,
          blocks: [{ p: sections.controller.blocks[0].p.replace("<mail>{email}</mail>", "{email}") }],
        };
        return { ...good, privacy: { ...good.privacy, sections: { ...sections, controller } } };
      },
      "privacy sections.controller.blocks[0].p: tags are none, the English text has <mail>",
    ],
    [
      "a placeholder renamed",
      (good: Texts) => ({ ...good, chrome: { ...good.chrome, lastUpdated: "Zuletzt <time>{datum}</time>" } }),
      "chrome lastUpdated: placeholders are {datum}, the English text has {date}",
    ],
    [
      "a missing unit",
      (good: Texts) => ({ about: good.about, privacy: good.privacy, chrome: good.chrome }),
      "terms: no file",
    ],
  ])("refuses %s and writes nothing", (_, change, failure) => {
    const { run, wrote } = inPagesSandbox((root) => ({
      run: importGerman(root, change),
      wrote: readdirSync(join(root, "src/lib/pages")).includes("translations"),
    }));

    expect(run.status).toBe(1);
    expect(run.failures).toContain(failure);
    expect(wrote).toBe(false);
  });

  it("refuses a long paragraph much shorter than the rest of the translation", () => {
    const run = inPagesSandbox((root) => importGerman(root, (good) => withPrivacyParagraph(good, "Kurzz.")));

    expect(run.status).toBe(1);
    expect(
      run.failures.some(
        (line) =>
          line.startsWith("privacy sections.short-version.blocks[0].p: ") && line.endsWith("text looks dropped"),
      ),
    ).toBe(true);
  });
});

describe("--pages verify", () => {
  it("has nothing to verify while English is the only locale that serves the pages", () => {
    expect(inPagesSandbox((root) => runLever(root, "--pages", "verify"))).toEqual({
      status: 0,
      stdout: "ok verify --pages: nothing to verify, en is the only locale that serves the pages\n",
      failures: [],
    });
  });

  it("fails a listed locale with no translation, then one that is not reviewed, and passes once approved", () => {
    const runs = inPagesSandbox((root) => {
      servePagesIn(root, ["de"]);
      const missing = runLever(root, "--pages", "verify");
      importGerman(root);
      const unreviewed = runLever(root, "--pages", "verify");
      const approved = runLever(root, "--pages", "approve", "de");
      return { missing, unreviewed, approved, verified: runLever(root, "--pages", "verify") };
    });

    expect(runs.missing.failures).toEqual(UNITS.map((name) => `[de] ${name}: no file`));
    expect(runs.unreviewed.failures).toEqual([...UNITS].sort().map((name) => `[de] ${name}: not reviewed`));
    expect(runs.approved).toEqual({ status: 0, stdout: "ok approve de: 4 files reviewed\n", failures: [] });
    expect(runs.verified).toEqual({ status: 0, stdout: "ok verify --pages: de\n", failures: [] });
  });

  it("fails an approved translation once its English text changes, or once it is edited by hand", () => {
    const runs = inPagesSandbox((root) => {
      servePagesIn(root, ["de"]);
      importGerman(root);
      runLever(root, "--pages", "approve", "de");
      const file = `${INSTALLED}/terms.json`;
      const approved = readJson(root, file);
      putJson(root, file, { ...approved, text: { ...approved.text, kicker: "Das Kleingedruckte" } });
      const edited = runLever(root, "--pages", "verify");
      putJson(root, file, approved);
      put(
        root,
        "src/lib/pages/terms.ts",
        read(root, "src/lib/pages/terms.ts").replace("The fine print", "The small print"),
      );
      return { edited, stale: runLever(root, "--pages", "verify") };
    });

    expect(runs.edited.failures).toEqual([
      "[de] terms: not reviewed, the approval is for another text, article or locale",
    ]);
    expect(runs.stale.failures).toContain(
      "[de] terms: sourceHash is stale, the English text changed after this translation was made",
    );
  });

  it("does not take an approval made for another locale", () => {
    const run = inPagesSandbox((root) => {
      servePagesIn(root, ["de", "nl"]);
      importGerman(root);
      runLever(root, "--pages", "approve", "de");
      UNITS.forEach((name) =>
        put(root, `src/lib/pages/translations/nl/${name}.json`, read(root, `${INSTALLED}/${name}.json`)),
      );
      return runLever(root, "--pages", "verify");
    });

    expect(run.failures).toEqual(
      expect.arrayContaining(
        UNITS.map((name) => `[nl] ${name}: not reviewed, the approval is for another text, article or locale`),
      ),
    );
  });
});
