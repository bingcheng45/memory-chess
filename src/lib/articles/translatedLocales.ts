import type { Locale } from "@/i18n/routing";

/**
 * The locales that serve articles, and the one list every surface reads:
 * routing, static params, the nav's EN marker, the language switcher and the
 * translation checks. A locale outside it sends its readers to the English URL
 * in one 308. A locale goes in only when every article has a reviewed
 * translation made from the current English text, which the build and
 * `scripts/articles-i18n.mjs verify` both enforce.
 */
export const TRANSLATED_ARTICLE_LOCALES: readonly Locale[] = ["en"];

export function servesArticlesIn(locale: string): locale is Locale {
  return (TRANSLATED_ARTICLE_LOCALES as readonly string[]).includes(locale);
}
