import { join } from "node:path";
import { counted, failuresOf, unreviewedOf } from "./checks.mjs";
import { partsOf } from "./icu.mjs";
import { inOrderOf, mapLeaves } from "./leaves.mjs";
import { ENGLISH } from "./names.mjs";
import {
  articleFile,
  chromeFile,
  hasInstalledChrome,
  messagesWithArticles,
  readInstalled,
  readWorkingDir,
  shown,
  toJson,
  writeChanged,
} from "./repo.mjs";

const INSTALLED_FILES = "the installed files";
const WHEN_IT_FAILS = { check: "", import: ", nothing was written", approve: ", nothing was approved" };

const sizeOf = (repo) =>
  `${counted(repo.articles.length, "article")} and ${counted(Object.keys(repo.chrome.strings).length, "chrome string")}`;
const passed = (summary) => ({ failures: [], summary });

// A translator reads this file whole, so a string names only the lists it has something in.
function chromeSource({ strings, sourceHash }) {
  const described = Object.entries(strings).map(([key, english]) => {
    const { placeholders, tags, plurals } = partsOf(english, ENGLISH);
    const lists = { placeholders, tags, plurals: [...new Set(plurals.map((plural) => plural.name))] };
    const filled = Object.entries(lists).filter(([, names]) => names.length > 0);
    return { key, english, ...Object.fromEntries(filled) };
  });
  return { sourceHash, strings: described };
}

export function exportSources(repo, outDir) {
  const dir = shown(repo.root, outDir);
  const files = [
    ...repo.articles.map(({ slug, sourceHash, text }) => ({
      file: join(dir, `${slug}.source.json`),
      content: toJson({ slug, sourceHash, text }),
    })),
    { file: join(dir, "chrome.source.json"), content: toJson(chromeSource(repo.chrome)) },
  ];
  writeChanged(repo.root, files);
  return passed(`ok export: ${sizeOf(repo)} in ${dir}`);
}

function read(repo, locale, dir) {
  if (dir === undefined) return { bundle: readInstalled(repo.root, locale), where: INSTALLED_FILES };
  return { bundle: readWorkingDir(repo.root, dir), where: shown(repo.root, dir) };
}

function checked(command, repo, locale, dir) {
  const { bundle, where } = read(repo, locale, dir);
  const failures = failuresOf(locale, repo, bundle);
  if (failures.length === 0) return { bundle, where };
  const summary = `${command} ${locale}: ${counted(failures.length, "failure")} in ${where}${WHEN_IT_FAILS[command]}`;
  return { failure: { failures, summary } };
}

export function check(repo, locale, dir) {
  const { failure, where } = checked("check", repo, locale, dir);
  return failure ?? passed(`ok check ${locale}: ${sizeOf(repo)} pass in ${where}`);
}

function installFiles(repo, locale, bundle, installed) {
  const { approvalHashOf } = repo.lib;
  // An approval outlives an import only when the import changes nothing the approval covers.
  const keptApproval = (old, hash) => {
    if (old === undefined || old.error !== undefined) return null;
    const isFromBeforeHashes =
      old.approvedHash === undefined && old.reviewed === true && approvalHashOf({ ...old, text: old.approvedText }) === hash;
    return old.approvedHash === hash || isFromBeforeHashes ? hash : null;
  };
  const installable = (old, next, approvedText) => ({
    ...next,
    approvedHash: keptApproval(old, approvalHashOf({ ...next, text: approvedText })),
  });
  const articles = repo.articles.map(({ slug, text, sourceHash }) => {
    const { sameAsEnglish, text: translated } = bundle.articles[slug];
    const next = { sourceHash, sameAsEnglish, text: inOrderOf(text, translated) };
    return articleFile(locale, slug, installable(installed.articles[slug], next, next.text));
  });
  const { sameAsEnglish, text: strings } = bundle.chrome;
  const namespace = mapLeaves(repo.chrome.namespace, (path) => strings[path]);
  const chrome = installable(installed.chrome, { sourceHash: repo.chrome.sourceHash, sameAsEnglish }, namespace);

  return [...articles, chromeFile(locale, chrome), messagesWithArticles(repo.root, locale, namespace)];
}

export function importTranslation(repo, locale, dir) {
  const { failure, bundle } = checked("import", repo, locale, dir);
  if (failure !== undefined) return failure;

  const files = installFiles(repo, locale, bundle, readInstalled(repo.root, locale));
  const written = writeChanged(repo.root, files);
  return passed(`ok import ${locale}: ${counted(written, "file")} written, ${files.length - written} unchanged`);
}

export function approve(repo, locale) {
  const { failure, bundle } = checked("approve", repo, locale);
  if (failure !== undefined) return failure;

  const approved = (unit) => ({ ...unit, approvedHash: repo.lib.approvalHashOf({ ...unit, text: unit.approvedText }) });
  const files = [
    ...repo.articles.map(({ slug, text }) => {
      const unit = bundle.articles[slug];
      return articleFile(locale, slug, { ...approved(unit), text: inOrderOf(text, unit.text) });
    }),
    chromeFile(locale, approved(bundle.chrome)),
  ];
  writeChanged(repo.root, files);
  return passed(`ok approve ${locale}: ${counted(files.length, "file")} reviewed`);
}

/** Gives every locale that has no translation yet the English chrome strings, which the page chrome needs to render. */
export function seed(repo) {
  const locales = repo.locales.filter((locale) => locale !== ENGLISH && !hasInstalledChrome(repo.root, locale));
  const files = locales.map((locale) => messagesWithArticles(repo.root, locale, repo.chrome.namespace));
  const written = writeChanged(repo.root, files);
  return passed(`ok seed: ${counted(written, "file")} changed, ${counted(locales.length, "untranslated locale")}`);
}

export function verify(repo) {
  const locales = repo.translatedLocales.filter((locale) => locale !== ENGLISH);
  if (locales.length === 0) return passed("ok verify: nothing to verify, en is the only locale that serves articles");

  const failures = locales.flatMap((locale) => {
    const bundle = readInstalled(repo.root, locale);
    const lines = [...failuresOf(locale, repo, bundle), ...unreviewedOf(repo.lib, bundle)];
    return lines.map((line) => `[${locale}] ${line}`);
  });
  if (failures.length > 0) return { failures, summary: `verify: ${counted(failures.length, "failure")}` };
  return passed(`ok verify: ${locales.join(", ")}`);
}
