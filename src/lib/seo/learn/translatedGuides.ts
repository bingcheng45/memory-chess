import type { Locale } from "@/i18n/routing";

/**
 * This file holds data only. `scripts/articles-i18n.mjs` imports it with Node's type stripping, which cannot follow
 * the `@/` alias at runtime.
 */
export const TRANSLATED_GUIDE_SLUGS = [
  "blindfold-chess-training-for-beginners",
  "how-to-see-the-whole-board-in-chess",
  "chess-visualization-exercises",
  "how-to-stop-blundering-in-chess",
  "how-to-get-better-at-chess-for-beginners",
] as const;

export const GUIDE_UNITS = [...TRANSLATED_GUIDE_SLUGS, "chrome"] as const;

export type GuideUnit = (typeof GUIDE_UNITS)[number];

export const approvalNameOf = (unit: string): string => `learn/${unit}`;

export type GuideIndexing = { readonly indexed: false } | { readonly indexed: true; readonly after: "adsense-approval" | "native-read" };

export type GuideLocaleIndexing = Readonly<Partial<Record<Locale, GuideIndexing>>>;

export const GUIDE_LOCALE_INDEXING: GuideLocaleIndexing = {
  ru: { indexed: false },
  "pt-BR": { indexed: false },
  fr: { indexed: false },
  de: { indexed: false },
  es: { indexed: false },
};

export const TRANSLATED_GUIDE_LOCALES = Object.keys(GUIDE_LOCALE_INDEXING) as Locale[];

export const isIndexedGuideLocale = (locale: string, config: GuideLocaleIndexing = GUIDE_LOCALE_INDEXING): boolean =>
  config[locale as Locale]?.indexed === true;

export const SERVED_GUIDES_FILE = "src/lib/seo/learn/servedGuides.json";
