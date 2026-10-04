import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Article, ArticleText } from "@/lib/articles/schema";

const REPO_ROOT = join(__dirname, "..", "..");
const LEVER_PATH = join(REPO_ROOT, "scripts", "articles-i18n.mjs");
const CHECKS_URL = pathToFileURL(join(REPO_ROOT, "scripts", "articles-i18n", "checks.mjs")).href;
const COPIED_FROM_THE_REPO = ["src/lib/articles/articleText.ts", "src/lib/articles/schema.ts"];
const COPIED_FOR_THE_REAL_LAYOUT = [
  "messages",
  "src/i18n/routing.ts",
  "src/lib/articles/entries",
  "src/lib/articles/translations",
];

export type Translation = {
  readonly articles: Readonly<Record<string, ArticleText>>;
  readonly chrome: Readonly<Record<string, string>>;
  readonly sameAsEnglish?: Readonly<Record<string, readonly string[]>>;
};

export type LeverRun = {
  readonly status: number | null;
  readonly stdout: string;
  readonly failures: readonly string[];
};

export const ADA: Article = {
  slug: "ada-example",
  publishedAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  title: "How Ada Example recalls a board",
  description: "A short profile written to test the translation tool.",
  person: { name: "Ada Example", role: "Champion, 2013-2023" },
  photo: {
    src: "/images/articles/ada-example.jpg",
    width: 840,
    height: 1050,
    alt: "Ada Example at a board in 2025",
    author: "A. Photographer",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0",
    sourceUrl: "https://example.org/ada",
    changes: "Cropped",
  },
  facts: {
    born: "30 Nov 1990, Oslo",
    country: "Norway",
    peakRating: "2882 (2014)",
    knownFor: "Blindfold play",
    memoryFeat: "Recalling 50,000 positions",
  },
  drill: {
    pieceCount: 12,
    memorizeTime: 5,
    why: "Five seconds is enough for a round of Memory Chess with 12 pieces.",
  },
  sections: [
    {
      heading: "Ten boards she could not see",
      paragraphs: [
        "In 2012 she played ten opponents at once and tracked 320 pieces without seeing a single board.",
        "She won every game.",
      ],
    },
  ],
  sources: [
    {
      title: "Thought and Choice in Chess",
      url: "https://example.org/book",
      note: "The 1965 book that describes the recall experiment.",
    },
  ],
};

export const BEN: Article = {
  slug: "ben-example",
  publishedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  title: "What Ben Example measured",
  description: "A second profile, with a photo that is in the public domain.",
  person: { name: "Ben Example", role: "Psychologist" },
  photo: {
    src: "/images/articles/ben-example.jpg",
    width: 840,
    height: 1050,
    alt: "Ben Example at his desk",
    author: "Unknown photographer",
    license: "Public domain",
    licenseUrl: null,
    sourceUrl: "https://example.org/ben",
    changes: "Cropped and resized",
  },
  facts: {
    born: "26 Oct 1914",
    country: "Netherlands",
    knownFor: "A recall experiment",
    memoryFeat: "Showing a position for five seconds",
  },
  drill: { pieceCount: 8, memorizeTime: 10, why: "A smaller board is a fair start." },
  sections: [{ heading: "The experiment", paragraphs: ["He showed players a position and took it away."] }],
  sources: [{ title: "Perception in Chess", url: "https://example.org/paper", note: "The paper that repeated it." }],
};

const FIXTURE_LOCALES = ["en", "de", "ru"];

export const FIXTURE_CHROME = {
  list: {
    heading: "Articles",
    about: "Each drill opens a round of Memory Chess.",
    corrections: "If something is wrong, <link>send a correction</link>.",
  },
  pager: { page: "Page {page}" },
  counts: { views: "{count, plural, one {# view} other {# views}}" },
};

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export function put(root: string, file: string, content: string): void {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content);
}

export function putJson(root: string, file: string, value: unknown): void {
  put(root, file, json(value));
}

export const read = (root: string, file: string) => readFileSync(join(root, file), "utf8");

export const readJson = (root: string, file: string) => JSON.parse(read(root, file));

export function putEntry(root: string, article: Article): void {
  const source = `import type { Article } from "../schema";\n\nconst article: Article = ${JSON.stringify(article, null, 2)};\n\nexport default article;\n`;
  put(root, `src/lib/articles/entries/${article.slug}.ts`, source);
}

export function putEnglishChrome(root: string, chrome: unknown): void {
  putJson(root, "messages/en.json", { common: { play: "Play" }, articles: chrome, home: { title: "Home" } });
}

export function setTranslatedLocales(root: string, locales: readonly string[]): void {
  put(
    root,
    "src/lib/articles/translatedLocales.ts",
    `import type { Locale } from "@/i18n/routing";\n\nexport const TRANSLATED_ARTICLE_LOCALES: readonly Locale[] = ${JSON.stringify(locales)};\n`,
  );
}

function writeFixtureLayout(root: string): void {
  const localeLines = FIXTURE_LOCALES.map((locale) => `  "${locale}",\n`).join("");
  put(root, "src/i18n/routing.ts", `export const LOCALES = [\n${localeLines}] as const;\n`);
  putEntry(root, ADA);
  putEntry(root, BEN);
  putEnglishChrome(root, FIXTURE_CHROME);
  FIXTURE_LOCALES.filter((locale) => locale !== "en").forEach((locale) =>
    putJson(root, `messages/${locale}.json`, {
      common: { play: `Play in ${locale}` },
      articles: FIXTURE_CHROME,
      home: { title: `Home in ${locale}` },
    }),
  );
}

/**
 * Runs `body` in a throwaway repo that holds only what the lever reads. `real`
 * copies the catalogues and entries of this repo. `fixture` writes two small
 * entries and a five-string catalogue, so a test can assert whole lines.
 */
export function inSandbox<T>(kind: "real" | "fixture", body: (root: string) => T): T {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "articles-i18n-")));
  try {
    const copied = kind === "real" ? [...COPIED_FROM_THE_REPO, ...COPIED_FOR_THE_REAL_LAYOUT] : COPIED_FROM_THE_REPO;
    copied.forEach((path) => cpSync(join(REPO_ROOT, path), join(root, path), { recursive: true }));
    if (kind === "fixture") writeFixtureLayout(root);
    // The repo's package.json has no "type" either, which is what makes Node warn about each .ts file.
    putJson(root, "package.json", { name: "sandbox", private: true });
    setTranslatedLocales(root, ["en"]);
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export function runLever(root: string, ...args: string[]): LeverRun {
  const run = spawnSync(process.execPath, [LEVER_PATH, ...args], { cwd: root, encoding: "utf8" });
  return { status: run.status, stdout: run.stdout, failures: run.stderr.split("\n").filter((line) => line !== "") };
}

/** Evaluates `expression` against the pure checks in a separate Node process, as Jest does not load ES modules. */
export function evalChecks<T>(expression: string): T {
  const program = `const checks = await import(${JSON.stringify(CHECKS_URL)}); process.stdout.write(JSON.stringify(${expression}));`;
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8" }));
}

export const SOURCE_DIR = "work/source";

/** Runs `export` and reads back the English text in the shape a translator's directory has. */
export function exportedEnglish(root: string): Translation {
  runLever(root, "export", SOURCE_DIR);
  const names = readdirSync(join(root, SOURCE_DIR)).filter((name) => name !== "chrome.source.json");
  const sources = names.map((name) => readJson(root, `${SOURCE_DIR}/${name}`));
  const chrome: { key: string; english: string }[] = readJson(root, `${SOURCE_DIR}/chrome.source.json`).strings;

  return {
    articles: Object.fromEntries(sources.map(({ slug, text }) => [slug, text])),
    chrome: Object.fromEntries(chrome.map(({ key, english }) => [key, english])),
  };
}

const KEPT_AS_IN_ENGLISH = /^(person\.name|photo\.author|sources\[\d+\]\.title)$/;
const HAS_LETTER = /\p{L}/u;

function translatedLeaves(value: unknown, word: (leaf: string) => string, path = ""): unknown {
  if (Array.isArray(value)) return value.map((item, index) => translatedLeaves(item, word, `${path}[${index}]`));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, translatedLeaves(item, word, path === "" ? key : `${path}.${key}`)]),
    );
  }
  const leaf = String(value);
  const isKept = KEPT_AS_IN_ENGLISH.test(path) || !HAS_LETTER.test(leaf) || (path === "photo.license" && leaf.startsWith("CC "));
  return isKept ? leaf : word(leaf);
}

function translated(english: Translation, word: (leaf: string) => string): Translation {
  return {
    articles: Object.fromEntries(
      Object.entries(english.articles).map(([slug, text]) => [slug, translatedLeaves(text, word) as ArticleText]),
    ),
    chrome: Object.fromEntries(Object.entries(english.chrome).map(([key, value]) => [key, word(value)])),
  };
}

/** A translation that passes for a language with Latin letters and two plural forms: every leaf gets a marker in front. */
export function marked(english: Translation): Translation {
  return translated(english, (leaf) => `Zz ${leaf}`);
}

const ICU_SYNTAX_AND_BRAND = /(\{\w+(?:, plural,)?|\b(?:one|other) \{|<\/?\w+>|Memory Chess)/;
const CYRILLIC_SMALL_A = 0x430;
const CYRILLIC_CAPITAL_A = 0x410;

function cyrillicLetter(letter: string): string {
  const isCapital = letter < "a";
  const index = letter.charCodeAt(0) - (isCapital ? "A" : "a").charCodeAt(0);
  return String.fromCharCode((isCapital ? CYRILLIC_CAPITAL_A : CYRILLIC_SMALL_A) + index);
}

function inCyrillic(leaf: string): string {
  return leaf
    .split(ICU_SYNTAX_AND_BRAND)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/[A-Za-z]/g, cyrillicLetter)))
    .join("");
}

/** A translation that passes for Russian: Cyrillic letters, and each plural with the four forms Russian has. */
export function inRussian(english: Translation): Translation {
  return translated(english, (leaf) => inCyrillic(leaf).replace(/other (\{[^{}]*\})/g, "few $1 many $1 other $1"));
}

export function writeTranslation(root: string, dir: string, translation: Partial<Translation>): void {
  rmSync(join(root, dir), { recursive: true, force: true });
  mkdirSync(join(root, dir), { recursive: true });
  Object.entries(translation.articles ?? {}).forEach(([slug, text]) => putJson(root, `${dir}/${slug}.json`, text));
  if (translation.chrome) putJson(root, `${dir}/chrome.json`, translation.chrome);
  if (translation.sameAsEnglish) putJson(root, `${dir}/same-as-english.json`, translation.sameAsEnglish);
}

export const GERMAN_DIR = "work/de";
export const INSTALLED_GERMAN = "src/lib/articles/translations/de";

/** Writes a German translation that passes, after `change`, into the working directory and imports it. */
export function importGerman(root: string, change: (good: Translation) => Translation = (good) => good): LeverRun {
  writeTranslation(root, GERMAN_DIR, change(marked(exportedEnglish(root))));
  return runLever(root, "import", "de", GERMAN_DIR);
}

/** `good` with the second paragraph of Ada's first section replaced. */
export function withSecondParagraph(good: Translation, paragraph: string): Translation {
  const ada = good.articles[ADA.slug];
  const sections = [{ ...ada.sections[0], paragraphs: [ada.sections[0].paragraphs[0], paragraph] }];
  return { ...good, articles: { ...good.articles, [ADA.slug]: { ...ada, sections } } };
}

/** Every file under `dir`, as path to content, for comparing two states of the sandbox byte for byte. */
export function filesUnder(root: string, dir: string): Record<string, string> {
  const names = readdirSync(join(root, dir), { recursive: true, withFileTypes: true });
  const paths = names.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
  return Object.fromEntries(paths.sort().map((path) => [path.slice(root.length + 1), readFileSync(path, "utf8")]));
}
