import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { ENGLISH_ONLY_ARTICLE_SLUGS, TRANSLATED_ARTICLE_LOCALES } from "./translatedLocales";

/**
 * Whether a locale serves the articles. English is the original text, so it
 * serves them whatever the list of translations holds: no edit of that list
 * can turn `/articles` into a 404. A locale outside both sends its readers to
 * the English URL in one 308.
 */
export function servesArticlesIn(locale: string): locale is Locale {
  return locale === DEFAULT_LOCALE || (TRANSLATED_ARTICLE_LOCALES as readonly string[]).includes(locale);
}

/** Whether `locale` serves this article: English serves every one, a translated locale all but the English-only ones. */
export function isArticleServedIn(slug: string, locale: string): boolean {
  return locale === DEFAULT_LOCALE || (servesArticlesIn(locale) && !ENGLISH_ONLY_ARTICLE_SLUGS.includes(slug));
}
