// `scripts/articles-i18n.mjs` imports this file with Node's type stripping, so it
// may hold only erasable TypeScript, `import type` for every type, and no
// runtime import except `node:crypto`.
import { createHash } from "node:crypto";
import type { Article, ArticleText } from "./schema";

type Tree = Record<string, unknown>;

const ROOT_LABEL = "(root)";

function isTree(value: unknown): value is Tree {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function textOf(article: Article): ArticleText {
  const { alt, author, license, changes } = article.photo;

  return {
    title: article.title,
    description: article.description,
    person: article.person,
    photo: { alt, author, license, changes },
    facts: article.facts,
    drill: { why: article.drill.why },
    sections: article.sections,
    sources: article.sources.map(({ title, note }) => ({ title, note })),
  };
}

/** `text` must have the shape of `textOf(english)`. */
export function withText(english: Article, text: ArticleText): Article {
  return {
    ...english,
    title: text.title,
    description: text.description,
    person: text.person,
    photo: { ...english.photo, ...text.photo },
    facts: text.facts,
    drill: { ...english.drill, why: text.drill.why },
    sections: text.sections,
    sources: english.sources.map((source, index) => ({ ...source, ...text.sources[index] })),
  };
}

function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withSortedKeys);
  if (!isTree(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, withSortedKeys(value[key])]),
  );
}

export function sourceHashOf(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(withSortedKeys(value))).digest("hex");
}

/** What a review covers: the text, the paths kept in English, and the English text both were made from. */
export type ApprovedContent = {
  readonly sourceHash: unknown;
  readonly sameAsEnglish: unknown;
  readonly text: unknown;
};

export function approvalHashOf({ sourceHash, sameAsEnglish, text }: ApprovedContent): string {
  return sourceHashOf({ sourceHash, sameAsEnglish, text });
}

/**
 * Why the installed file `file` does not count as reviewed. `text` is what its
 * review covers: the file's own `text` for an article, the `articles` messages
 * of the locale for the chrome.
 */
export function approvalProblems(file: Tree, text: unknown): string[] {
  const { sourceHash, sameAsEnglish, approvedHash } = file;
  if (approvedHash === approvalHashOf({ sourceHash, sameAsEnglish, text })) return [];
  return [typeof approvedHash === "string" ? "not reviewed, edited after it was approved" : "not reviewed"];
}

const INSTALLED_FILE_KEYS = {
  article: ["sourceHash", "approvedHash", "sameAsEnglish", "text"],
  chrome: ["sourceHash", "approvedHash", "sameAsEnglish"],
} as const;

/**
 * The keys of an installed file that the lever does not write. A flag such as
 * `reviewed`, added by hand, means nothing and must not look as if it did.
 */
export function unknownKeyProblems(keys: readonly string[], kind: keyof typeof INSTALLED_FILE_KEYS): string[] {
  const known: readonly string[] = INSTALLED_FILE_KEYS[kind];
  return keys.filter((key) => !known.includes(key)).map((key) => `unknown key "${key}"`);
}

function leafProblems(candidate: unknown, label: string): string[] {
  if (typeof candidate !== "string") return [`${label}: not a string`];
  if (candidate.trim() === "") return [`${label}: empty`];
  if (candidate !== candidate.trim()) return [`${label}: leading or trailing space`];
  return [];
}

function listProblems(english: readonly unknown[], candidate: unknown, path: string, label: string): string[] {
  if (!Array.isArray(candidate)) return [`${label}: not a list`];
  if (candidate.length !== english.length) {
    return [`${label}: ${candidate.length} items where the English text has ${english.length}`];
  }
  return english.flatMap((item, index) => shapeProblems(item, candidate[index], `${path}[${index}]`));
}

function treeProblems(english: Tree, candidate: unknown, path: string, label: string): string[] {
  if (!isTree(candidate)) return [`${label}: not an object`];
  const pathOf = (key: string) => (path === "" ? key : `${path}.${key}`);
  const extra = Object.keys(candidate).filter((key) => !(key in english));

  return [
    ...Object.keys(english).flatMap((key) =>
      key in candidate ? shapeProblems(english[key], candidate[key], pathOf(key)) : [`${pathOf(key)}: missing`],
    ),
    ...extra.map((key) => `${pathOf(key)}: not in the English text`),
  ];
}

/**
 * What stops `candidate` from being a translation of `english`: a different
 * set of keys in an object, a different length of a list, or a leaf that is
 * not a non-empty trimmed string. One line per problem, each starting with the
 * leaf path (`sections[2].paragraphs[1]`, `facts.born`).
 */
export function shapeProblems(english: unknown, candidate: unknown, path: string = ""): string[] {
  const label = path === "" ? ROOT_LABEL : path;
  if (Array.isArray(english)) return listProblems(english, candidate, path, label);
  if (isTree(english)) return treeProblems(english, candidate, path, label);
  return leafProblems(candidate, label);
}

export function translationProblems(file: unknown, english: ArticleText): string[] {
  if (!isTree(file)) return ["the file is not an object"];

  return [
    ...unknownKeyProblems(Object.keys(file), "article"),
    ...shapeProblems(english, file.text, "text"),
    ...(file.sourceHash === sourceHashOf(english) ? [] : ["sourceHash is stale"]),
    ...approvalProblems(file, file.text),
  ];
}
