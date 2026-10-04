#!/usr/bin/env node
/**
 * The one tool that writes an article translation into the repo, and the one
 * definition of "this translation is acceptable". A translator, a reviewer,
 * the integrator and a Jest test all run it.
 *
 * Failures go to stderr, one per line. A summary goes to stdout, and it starts
 * with `ok` when the command passed. Exit 1 means a failure, exit 2 a mistake
 * in the call or the place it runs from.
 */
import { approve, check, exportSources, importTranslation, seed, verify } from "./articles-i18n/commands.mjs";
import { ENGLISH } from "./articles-i18n/names.mjs";
import { UsageError, loadRepo } from "./articles-i18n/repo.mjs";

const USAGE = `Usage: node scripts/articles-i18n.mjs <command>

  export <outDir>          write the English sources a translator works from
  check <locale> [dir]     check a translator's directory, or the installed files when no dir is given
  import <locale> <dir>    check a directory, then install it with reviewed: false
  approve <locale>         check the installed files, then set reviewed: true
  seed                     give every locale without a translation the English chrome strings
  verify                   check every locale that serves articles and require reviewed: true

Run it from the repo root. Every path must stay inside the repo.
`;

const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const COMMANDS = {
  export: { minArgs: 1, maxArgs: 1, takesLocale: false, run: (repo, [outDir]) => exportSources(repo, outDir) },
  check: { minArgs: 1, maxArgs: 2, takesLocale: true, run: (repo, [locale, dir]) => check(repo, locale, dir) },
  import: { minArgs: 2, maxArgs: 2, takesLocale: true, run: (repo, [locale, dir]) => importTranslation(repo, locale, dir) },
  approve: { minArgs: 1, maxArgs: 1, takesLocale: true, run: (repo, [locale]) => approve(repo, locale) },
  seed: { minArgs: 0, maxArgs: 0, takesLocale: false, run: (repo) => seed(repo) },
  verify: { minArgs: 0, maxArgs: 0, takesLocale: false, run: (repo) => verify(repo) },
};

const oneLine = (text) => text.replace(/\s*\n\s*/g, " ");

async function run([name = "", ...args]) {
  const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (!command || args.length < command.minArgs || args.length > command.maxArgs) {
    process.stderr.write(USAGE);
    return EXIT_USAGE;
  }
  const repo = await loadRepo(process.cwd());
  if (command.takesLocale && (args[0] === ENGLISH || !repo.locales.includes(args[0]))) {
    throw new UsageError(`"${args[0]}" is not a shipped locale other than ${ENGLISH}`);
  }

  const { failures, summary } = command.run(repo, args);
  failures.forEach((failure) => process.stderr.write(`${oneLine(failure)}\n`));
  process.stdout.write(`${summary}\n`);
  return failures.length === 0 ? 0 : EXIT_FAILED;
}

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`articles-i18n: ${error instanceof UsageError ? error.message : error.stack}\n`);
  process.exitCode = EXIT_USAGE;
}
