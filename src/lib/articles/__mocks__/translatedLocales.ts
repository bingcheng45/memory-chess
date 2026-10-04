import type { Locale } from "@/i18n/routing";

// Two locales on purpose. Every shipped locale serves articles, so a test reaches the code for a locale
// without them, such as `fr` here, only through this list.
export const TRANSLATED_ARTICLE_LOCALES: readonly Locale[] = ["en", "de"];

export function servesArticlesIn(locale: string): locale is Locale {
  return (TRANSLATED_ARTICLE_LOCALES as readonly string[]).includes(locale);
}
