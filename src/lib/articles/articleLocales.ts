import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { TRANSLATED_ARTICLE_LOCALES } from "./translatedLocales";

/**
 * Whether a locale serves the articles. English is the original text, so it
 * serves them whatever the list of translations holds: no edit of that list
 * can turn `/articles` into a 404. A locale outside both sends its readers to
 * the English URL in one 308.
 */
export function servesArticlesIn(locale: string): locale is Locale {
  return locale === DEFAULT_LOCALE || (TRANSLATED_ARTICLE_LOCALES as readonly string[]).includes(locale);
}
