import type { Locale } from "@/i18n/routing";

export const TRANSLATED_ARTICLE_LOCALES: readonly Locale[] = ["en", "de"];

export function servesArticlesIn(locale: string): locale is Locale {
  return (TRANSLATED_ARTICLE_LOCALES as readonly string[]).includes(locale);
}
