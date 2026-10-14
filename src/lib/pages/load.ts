// The translation files and their approval bookkeeping must never reach a client bundle.
import "server-only";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { translationProblems } from "@/lib/articles/articleText";
import { servedLocalesOf } from "@/lib/seo/englishOnly";
import englishChrome from "./readingChrome";
import { PAGES } from "./registry";
import type { PageText, ReadingChrome } from "./schema";
import { TRANSLATED_PAGE_LOCALES, approvalNameOf, type PageName, type PageUnit } from "./translatedLocales";

export interface LoadedPage {
  readonly text: PageText;
  readonly chrome: ReadingChrome;
}

export type PageSource = (locale: Locale, unit: PageUnit) => Promise<unknown>;

const readTranslationFile: PageSource = async (locale, unit) =>
  (await import(`./translations/${locale}/${unit}.json`)).default;

/** The locale of a request for a trust page, or a 404 when that locale does not serve it. */
export function servedPageLocale(name: PageName, locale: string): Locale {
  if (!servedLocalesOf(PAGES[name].route).includes(locale)) notFound();
  return locale as Locale;
}

async function translated<T>(source: PageSource, locale: Locale, unit: PageUnit, english: T): Promise<T> {
  let file: unknown;
  try {
    file = await source(locale, unit);
  } catch (cause) {
    throw new Error(`Page translation ${locale}/${unit} cannot be read`, { cause });
  }
  const problems = translationProblems(file, english, { locale, slug: approvalNameOf(unit) });
  if (problems.length > 0) {
    throw new Error(`Page translation ${locale}/${unit} cannot be published: ${problems.join("; ")}`);
  }
  return (file as { text: T }).text;
}

/**
 * The text of a trust page and its reading chrome in `locale`. A translation must be reviewed and made from the
 * current English text, or this throws, which stops a build that prerenders it. It never answers with English text
 * for another locale.
 */
export async function loadPage(name: PageName, locale: Locale, source: PageSource = readTranslationFile): Promise<LoadedPage> {
  const english = PAGES[name].english;
  if (locale === DEFAULT_LOCALE) return { text: english, chrome: englishChrome };
  if (!TRANSLATED_PAGE_LOCALES.includes(locale)) throw new Error(`Page ${locale}/${name} has no translation`);

  const [text, chrome] = await Promise.all([
    translated(source, locale, name, english),
    translated(source, locale, "chrome", englishChrome),
  ]);
  return { text, chrome };
}
