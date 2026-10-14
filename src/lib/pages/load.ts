import "server-only";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { servedLocalesOf } from "@/lib/seo/englishOnly";
import englishChrome from "./readingChrome";
import { PAGES } from "./registry";
import type { PageText, ReadingChrome } from "./schema";
import type { PageName } from "./translatedLocales";

export interface LoadedPage {
  readonly text: PageText;
  readonly chrome: ReadingChrome;
}

/** The locale of a request for a trust page, or a 404 when that locale does not serve it. */
export function servedPageLocale(name: PageName, locale: string): Locale {
  if (!servedLocalesOf(PAGES[name].route).includes(locale)) notFound();
  return locale as Locale;
}

/** The text of a trust page and its reading chrome in `locale`. It never answers another locale with English text. */
export async function loadPage(name: PageName, locale: Locale): Promise<LoadedPage> {
  if (locale === DEFAULT_LOCALE) return { text: PAGES[name].english, chrome: englishChrome };
  throw new Error(`Page ${locale}/${name} has no translation`);
}
