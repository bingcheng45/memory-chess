import { existsSync, realpathSync } from "node:fs";
import { counted } from "./checks.mjs";
import { UsageError, importTypeScript, inside, muteTypelessPackageWarning, shippedLocales } from "./repo.mjs";
import { unitCommands } from "./units.mjs";

const PAGES_DIR = "src/lib/pages";
// The chrome's English text is the module the reading page itself imports.
const englishModuleOf = (unit) => `${PAGES_DIR}/${unit === "chrome" ? "readingChrome" : unit}.ts`;

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

export const PAGE_COMMANDS = unitCommands({
  translationsDir: `${PAGES_DIR}/translations`,
  flag: "--pages",
  served: "the pages",
  size: (repo) => `${counted(repo.units.length - 1, "page")} and the chrome`,
  isBody: undefined,
  extraFailures: () => [],
});
