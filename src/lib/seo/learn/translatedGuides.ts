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

/**
 * The locales that serve the translated guides, each with whether search may index it. `indexed: false` makes a
 * translation `noindex, follow` with a self canonical, no hreflang and no sitemap entry. AdSense rejected the site
 * three times for low value content, and machine-translated guides were part of what it saw, so a locale turns
 * `indexed: true` only after AdSense approves the site or a native speaker reads its guides
 * (docs/adsense-resubmission.md). That one value turns on the robots, the hreflang and the sitemap entries together.
 */
export const GUIDE_LOCALE_INDEXING: Readonly<Partial<Record<Locale, { readonly indexed: boolean }>>> = {
  ru: { indexed: false },
  "pt-BR": { indexed: false },
  fr: { indexed: false },
  de: { indexed: false },
  es: { indexed: false },
};

export const TRANSLATED_GUIDE_LOCALES = Object.keys(GUIDE_LOCALE_INDEXING) as Locale[];

export const isIndexedGuideLocale = (locale: string): boolean => GUIDE_LOCALE_INDEXING[locale as Locale]?.indexed === true;

/** Where `--guides verify` writes the guide translations that are current and approved, by slug. */
export const SERVED_GUIDES_FILE = "src/lib/seo/learn/servedGuides.json";
