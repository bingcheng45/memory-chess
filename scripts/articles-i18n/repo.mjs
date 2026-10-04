import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { isTree, leavesOf } from "./leaves.mjs";
import { CHROME, ENGLISH } from "./names.mjs";

/** A mistake in how the tool was called or where it runs. It ends the run with exit code 2. */
export class UsageError extends Error {}

const SAME_AS_ENGLISH = "same-as-english";
const MESSAGES_DIR = "messages";
const ARTICLES_DIR = "src/lib/articles";
const ENTRIES_DIR = `${ARTICLES_DIR}/entries`;
const TRANSLATIONS_DIR = `${ARTICLES_DIR}/translations`;
const TRANSLATED_LOCALES_FILE = `${ARTICLES_DIR}/translatedLocales.ts`;
const ROUTING_FILE = "src/i18n/routing.ts";
const TYPELESS_PACKAGE_WARNING = "MODULE_TYPELESS_PACKAGE_JSON";

const messagesFile = (locale) => `${MESSAGES_DIR}/${locale}.json`;
const installedFile = (locale, name) => `${TRANSLATIONS_DIR}/${locale}/${name}.json`;

export const toJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const isWithin = (root, path) => path === root || path.startsWith(root + sep);

function realPathOf(path) {
  if (lstatSync(path, { throwIfNoEntry: false })) return realpathSync(path);
  const parent = dirname(path);
  return parent === path ? path : join(realPathOf(parent), basename(path));
}

/** The absolute form of `path`, which must stay in the repo by its dots and through every symlink on the way. */
export function inside(root, path) {
  const absolute = resolve(root, path);
  if (!isWithin(root, absolute) || !isWithin(root, realPathOf(absolute))) {
    throw new UsageError(`${path} is outside the repo`);
  }
  return absolute;
}

/** `path` as the repo sees it, for a summary line. */
export const shown = (root, path) => relative(root, inside(root, path)) || ".";

const readText = (root, file) => readFileSync(inside(root, file), "utf8");

function parsed(root, file) {
  try {
    return { value: JSON.parse(readText(root, file)) };
  } catch (error) {
    return { error: `not valid JSON, ${error.message}` };
  }
}

function readMessages(root, locale) {
  const file = parsed(root, messagesFile(locale));
  if (file.error !== undefined) throw new UsageError(`${messagesFile(locale)} is ${file.error}`);
  return file.value;
}

// The repo's package.json has no "type", so Node warns on stderr about the
// first .ts file it loads. Stderr carries one line per failure and nothing else.
function muteTypelessPackageWarning() {
  const emitWarning = process.emitWarning;
  process.emitWarning = (warning, ...rest) =>
    rest[0]?.code === TYPELESS_PACKAGE_WARNING ? undefined : emitWarning.call(process, warning, ...rest);
}

const importTypeScript = (root, file) => import(pathToFileURL(inside(root, file)).href);

function shippedLocales(root) {
  const block = readText(root, ROUTING_FILE).match(/export const LOCALES = \[([\s\S]*?)\] as const;/);
  if (!block) throw new UsageError(`${ROUTING_FILE} has no LOCALES list`);
  return [...block[1].matchAll(/"([\w-]+)"/g)].map((match) => match[1]);
}

async function englishArticles(root, { textOf, sourceHashOf }) {
  const slugs = readdirSync(inside(root, ENTRIES_DIR))
    .filter((name) => name.endsWith(".ts"))
    .map((name) => name.slice(0, -".ts".length))
    .sort();
  const entries = await Promise.all(slugs.map((slug) => importTypeScript(root, `${ENTRIES_DIR}/${slug}.ts`)));

  return entries.map((entry, index) => {
    const text = textOf(entry.default);
    return { slug: slugs[index], text, sourceHash: sourceHashOf(text) };
  });
}

/**
 * The English side of the repo at `cwd`, the locales it ships and serves
 * articles in, and the functions that split and hash an article. Everything
 * else in the tool takes this as `repo`.
 *
 * @returns {Promise<{
 *   root: string,
 *   locales: string[],
 *   translatedLocales: string[],
 *   lib: { textOf: Function, sourceHashOf: Function, shapeProblems: Function },
 *   articles: { slug: string, text: object, sourceHash: string }[],
 *   chrome: { namespace: object, strings: Record<string, string>, sourceHash: string },
 * }>}
 */
export async function loadRepo(cwd) {
  if (!process.features.typescript) {
    throw new UsageError("this needs a Node that strips TypeScript types, 22.18 or newer");
  }
  const root = realpathSync(cwd);
  [messagesFile(ENGLISH), ENTRIES_DIR].forEach((required) => {
    if (!existsSync(inside(root, required))) throw new UsageError(`${required} is missing, run this from the repo root`);
  });
  muteTypelessPackageWarning();
  const lib = await importTypeScript(root, `${ARTICLES_DIR}/articleText.ts`);
  const { TRANSLATED_ARTICLE_LOCALES } = await importTypeScript(root, TRANSLATED_LOCALES_FILE);
  const namespace = readMessages(root, ENGLISH).articles;

  return {
    root,
    locales: shippedLocales(root),
    translatedLocales: TRANSLATED_ARTICLE_LOCALES,
    lib,
    articles: await englishArticles(root, lib),
    chrome: { namespace, strings: Object.fromEntries(leavesOf(namespace)), sourceHash: lib.sourceHashOf(namespace) },
  };
}

function jsonNames(root, dir) {
  if (!statSync(inside(root, dir), { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(inside(root, dir))
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .sort();
}

/** One locale as a translator left it in `dir`: bare article texts, a flat chrome map and the optional list of paths kept in English. */
export function readWorkingDir(root, dir) {
  if (!statSync(inside(root, dir), { throwIfNoEntry: false })?.isDirectory()) {
    throw new UsageError(`${dir} is not a directory`);
  }
  const names = jsonNames(root, dir);
  const same = names.includes(SAME_AS_ENGLISH) ? parsed(root, join(dir, `${SAME_AS_ENGLISH}.json`)) : { value: {} };
  const lists = isTree(same.value) ? same.value : {};
  const unitOf = (name) => {
    const file = parsed(root, join(dir, `${name}.json`));
    return file.error === undefined ? { text: file.value, sameAsEnglish: lists[name] ?? [] } : { error: file.error };
  };

  return {
    installed: false,
    problems: same.error === undefined && isTree(same.value) ? [] : [`${SAME_AS_ENGLISH}.json: ${same.error ?? "not an object"}`],
    sameAsEnglishKeys: Object.keys(lists),
    articles: Object.fromEntries(
      names.filter((name) => name !== CHROME && name !== SAME_AS_ENGLISH).map((name) => [name, unitOf(name)]),
    ),
    chrome: names.includes(CHROME) ? unitOf(CHROME) : undefined,
  };
}

/** One locale as it is installed, in the shape `readWorkingDir` gives. The chrome strings come from the message catalogue. */
export function readInstalled(root, locale) {
  const names = jsonNames(root, `${TRANSLATIONS_DIR}/${locale}`);
  const unitOf = (name, textIn) => {
    const file = parsed(root, installedFile(locale, name));
    if (file.error !== undefined) return { error: file.error };
    if (!isTree(file.value)) return { error: "not an object" };
    const { sourceHash, reviewed, sameAsEnglish } = file.value;
    return { sourceHash, reviewed, sameAsEnglish, text: textIn(file.value) };
  };
  const chromeStrings = () => Object.fromEntries(leavesOf(readMessages(root, locale).articles ?? {}));

  return {
    installed: true,
    problems: [],
    sameAsEnglishKeys: [],
    articles: Object.fromEntries(names.filter((name) => name !== CHROME).map((name) => [name, unitOf(name, (file) => file.text)])),
    chrome: names.includes(CHROME) ? unitOf(CHROME, chromeStrings) : undefined,
  };
}

export const hasInstalledChrome = (root, locale) => existsSync(inside(root, installedFile(locale, CHROME)));

export function articleFile(locale, slug, { sourceHash, reviewed, sameAsEnglish, text }) {
  return { file: installedFile(locale, slug), content: toJson({ sourceHash, reviewed, sameAsEnglish, text }) };
}

export function chromeFile(locale, { sourceHash, reviewed, sameAsEnglish }) {
  return { file: installedFile(locale, CHROME), content: toJson({ sourceHash, reviewed, sameAsEnglish }) };
}

/** The catalogue of `locale` with its `articles` key replaced and every other byte as it is on disk. */
export function messagesWithArticles(root, locale, articles) {
  const file = messagesFile(locale);
  const messages = readMessages(root, locale);
  if (toJson(messages) !== readText(root, file)) {
    throw new UsageError(
      `${file} is not formatted as JSON.stringify(value, null, 2) plus a newline, so a merge would rewrite lines outside articles`,
    );
  }
  return { file, content: toJson({ ...messages, articles }) };
}

/**
 * Writes the files whose bytes differ and says how many that was. A file is
 * replaced by one rename, so a run that dies never leaves half a file behind.
 *
 * @param {string} root
 * @param {{ file: string, content: string }[]} files
 * @returns {number}
 */
export function writeChanged(root, files) {
  const changed = files.filter(({ file, content }) => !existsSync(inside(root, file)) || readText(root, file) !== content);
  changed.forEach(({ file, content }) => {
    const path = inside(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(`${path}.tmp`, content);
    renameSync(`${path}.tmp`, path);
  });
  return changed.length;
}
