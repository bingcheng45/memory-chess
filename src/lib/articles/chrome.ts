// The approval bookkeeping must never reach a client bundle.
import "server-only";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { chromeProblems } from "./articleText";

/** Where the strings of the section come from. `messages` is the `articles` namespace of a locale's catalogue. */
export type ChromeSource = {
  readonly file: (locale: Locale) => Promise<unknown>;
  readonly messages: (locale: Locale) => Promise<unknown>;
};

const repository: ChromeSource = {
  file: async (locale) => (await import(`./translations/${locale}/chrome.json`)).default,
  messages: async (locale) => (await import(`../../../messages/${locale}.json`)).default.articles,
};

async function read(source: ChromeSource, locale: Locale): Promise<[file: unknown, english: unknown, translated: unknown]> {
  try {
    return await Promise.all([source.file(locale), source.messages(DEFAULT_LOCALE), source.messages(locale)]);
  } catch (cause) {
    throw new Error(`Article chrome ${locale} cannot be read`, { cause });
  }
}

/**
 * The strings of the Articles section in `locale`, approved as they stand and
 * made from the current English strings. Throws when they are missing, stale,
 * unapproved, edited after their approval or the wrong shape. The build has no
 * other check of these strings, so this is what stops a deploy.
 */
export async function loadArticleChrome(locale: Locale, source: ChromeSource = repository): Promise<unknown> {
  const [file, english, translated] = await read(source, locale);
  const problems = chromeProblems(file, english, translated, locale);

  if (problems.length > 0) {
    throw new Error(`Article chrome ${locale} cannot be published: ${problems.join("; ")}`);
  }

  return translated;
}
