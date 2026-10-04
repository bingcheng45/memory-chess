import type { Locale } from "@/i18n/routing";

/**
 * The locales that have translated articles. English is the original and is
 * not here: `servesArticlesIn` in `articleLocales.ts` serves it by itself and
 * is what routing, static params, the nav's EN marker and the language
 * switcher read.
 *
 * This file holds data only. `scripts/articles-i18n/repo.mjs` imports it with
 * Node's type stripping, which cannot follow the `@/` alias at runtime.
 *
 * A locale goes in only when every article and every string of the section has
 * a reviewed translation made from the current English text. The build fails
 * on an article that is missing, stale or unreviewed. Jest runs
 * `scripts/articles-i18n.mjs verify`, which checks the section's strings too.
 */
export const TRANSLATED_ARTICLE_LOCALES: readonly Locale[] = [
  "es",
  "ru",
  "pt-BR",
  "de",
  "fr",
  "hi",
  "it",
  "zh-CN",
  "tr",
  "sv",
  "nl",
  "pl",
  "id",
  "no",
  "fi",
  "ro",
  "vi",
  "cs",
  "ja",
  "ko",
  "zh-TW",
  "da",
  "hu",
];
