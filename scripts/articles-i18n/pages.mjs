import { existsSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import { counted, pageFailuresOf, pageUnreviewedOf } from "./checks.mjs";
import { inOrderOf, isTree } from "./leaves.mjs";
import { ENGLISH } from "./names.mjs";
import {
  SAME_AS_ENGLISH,
  UsageError,
  importTypeScript,
  inside,
  jsonNames,
  muteTypelessPackageWarning,
  parsed,
  shippedLocales,
  shown,
  toJson,
  writeChanged,
} from "./repo.mjs";

const PAGES_DIR = "src/lib/pages";
const TRANSLATIONS_DIR = `${PAGES_DIR}/translations`;
// The chrome's English text is the module the reading page itself imports.
const englishModuleOf = (unit) => `${PAGES_DIR}/${unit === "chrome" ? "readingChrome" : unit}.ts`;
const installedFile = (locale, unit) => `${TRANSLATIONS_DIR}/${locale}/${unit}.json`;

const INSTALLED_FILES = "the installed files";
const WHEN_IT_FAILS = { check: "", import: ", nothing was written", approve: ", nothing was approved" };
const passed = (summary) => ({ failures: [], summary });

/**
 * The English side of the trust pages: one unit per page and one for the reading chrome, each with the hash of its
 * text, and the locales that serve the pages. The same shape as `loadRepo`, with `units` where it has `articles`.
 */
export async function loadPagesRepo(cwd) {
  if (!process.features.typescript) {
    throw new UsageError("this needs a Node that strips TypeScript types, 22.18 or newer");
  }
  const root = realpathSync(cwd);
  if (!existsSync(inside(root, `${PAGES_DIR}/translatedLocales.ts`))) {
    throw new UsageError(`${PAGES_DIR}/translatedLocales.ts is missing, run this from the repo root`);
  }
  muteTypelessPackageWarning();
  const lib = await importTypeScript(root, "src/lib/articles/articleText.ts");
  const { PAGE_UNITS, TRANSLATED_PAGE_LOCALES, approvalNameOf } = await importTypeScript(root, `${PAGES_DIR}/translatedLocales.ts`);
  const modules = await Promise.all(PAGE_UNITS.map((unit) => importTypeScript(root, englishModuleOf(unit))));

  return {
    root,
    locales: shippedLocales(root),
    translatedLocales: TRANSLATED_PAGE_LOCALES,
    lib,
    approvalNameOf,
    units: modules.map(({ default: text }, index) => ({ name: PAGE_UNITS[index], text, sourceHash: lib.sourceHashOf(text) })),
  };
}

function readWorkingDir(root, dir) {
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
    units: Object.fromEntries(names.filter((name) => name !== SAME_AS_ENGLISH).map((name) => [name, unitOf(name)])),
  };
}

function readInstalled(root, locale) {
  const unitOf = (name) => {
    const file = parsed(root, installedFile(locale, name));
    if (file.error !== undefined) return { error: file.error };
    if (!isTree(file.value)) return { error: "not an object" };
    const { sourceHash, approvedHash, sameAsEnglish, text } = file.value;
    return { keys: Object.keys(file.value), sourceHash, approvedHash, sameAsEnglish, text };
  };
  const names = jsonNames(root, `${TRANSLATIONS_DIR}/${locale}`);
  return { installed: true, problems: [], sameAsEnglishKeys: [], units: Object.fromEntries(names.map((name) => [name, unitOf(name)])) };
}

const unitFile = (locale, name, { sourceHash, approvedHash, sameAsEnglish, text }) => ({
  file: installedFile(locale, name),
  content: toJson({ sourceHash, approvedHash, sameAsEnglish, text }),
});

const sizeOf = (repo) => `${counted(repo.units.length - 1, "page")} and the chrome`;

function checked(command, repo, locale, dir) {
  const bundle = dir === undefined ? readInstalled(repo.root, locale) : readWorkingDir(repo.root, dir);
  const where = dir === undefined ? INSTALLED_FILES : shown(repo.root, dir);
  const failures = pageFailuresOf(locale, repo, bundle);
  if (failures.length === 0) return { bundle, where };
  const summary = `${command} ${locale}: ${counted(failures.length, "failure")} in ${where}${WHEN_IT_FAILS[command]}`;
  return { failure: { failures, summary } };
}

const approvalOf = (repo, locale, name, unit) =>
  repo.lib.approvalHashOf({ ...unit, locale, name: repo.approvalNameOf(name), text: unit.text });

function exportSources(repo, outDir) {
  const dir = shown(repo.root, outDir);
  const files = repo.units.map(({ name, sourceHash, text }) => ({
    file: join(dir, `${name}.source.json`),
    content: toJson({ name, sourceHash, text }),
  }));
  writeChanged(repo.root, files);
  return passed(`ok export: ${sizeOf(repo)} in ${dir}`);
}

function check(repo, locale, dir) {
  const { failure, where } = checked("check", repo, locale, dir);
  return failure ?? passed(`ok check ${locale}: ${sizeOf(repo)} pass in ${where}`);
}

function importTranslation(repo, locale, dir) {
  const { failure, bundle } = checked("import", repo, locale, dir);
  if (failure !== undefined) return failure;

  const installed = readInstalled(repo.root, locale).units;
  // An approval outlives an import only when the import changes nothing the approval covers.
  const files = repo.units.map(({ name, sourceHash, text: english }) => {
    const { sameAsEnglish, text } = bundle.units[name];
    const next = { sourceHash, sameAsEnglish, text: inOrderOf(english, text) };
    const hash = approvalOf(repo, locale, name, next);
    return unitFile(locale, name, { ...next, approvedHash: installed[name]?.approvedHash === hash ? hash : null });
  });
  const written = writeChanged(repo.root, files);
  return passed(`ok import ${locale}: ${counted(written, "file")} written, ${files.length - written} unchanged`);
}

function approve(repo, locale) {
  const { failure, bundle } = checked("approve", repo, locale);
  if (failure !== undefined) return failure;

  const files = repo.units.map(({ name }) => {
    const unit = bundle.units[name];
    return unitFile(locale, name, { ...unit, approvedHash: approvalOf(repo, locale, name, unit) });
  });
  writeChanged(repo.root, files);
  return passed(`ok approve ${locale}: ${counted(files.length, "file")} reviewed`);
}

function verify(repo) {
  const locales = repo.translatedLocales.filter((locale) => locale !== ENGLISH);
  if (locales.length === 0) return passed("ok verify --pages: nothing to verify, en is the only locale that serves the pages");

  const failures = locales.flatMap((locale) => {
    const bundle = readInstalled(repo.root, locale);
    const lines = [...pageFailuresOf(locale, repo, bundle), ...pageUnreviewedOf(repo.lib, repo.approvalNameOf, locale, bundle)];
    return lines.map((line) => `[${locale}] ${line}`);
  });
  if (failures.length > 0) return { failures, summary: `verify --pages: ${counted(failures.length, "failure")}` };
  return passed(`ok verify --pages: ${locales.join(", ")}`);
}

export const PAGE_COMMANDS = {
  export: { minArgs: 1, maxArgs: 1, takesLocale: false, run: (repo, [outDir]) => exportSources(repo, outDir) },
  check: { minArgs: 1, maxArgs: 2, takesLocale: true, run: (repo, [locale, dir]) => check(repo, locale, dir) },
  import: { minArgs: 2, maxArgs: 2, takesLocale: true, run: (repo, [locale, dir]) => importTranslation(repo, locale, dir) },
  approve: { minArgs: 1, maxArgs: 1, takesLocale: true, run: (repo, [locale]) => approve(repo, locale) },
  verify: { minArgs: 0, maxArgs: 0, takesLocale: false, run: (repo) => verify(repo) },
};
