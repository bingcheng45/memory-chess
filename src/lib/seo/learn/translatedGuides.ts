import type { Locale } from "@/i18n/routing";

/**
 * The guides served in translation, chosen from GA4: the five that AI assistants sent visitors to in the 90 days to
 * 2026-10-20. Every guide here is served in every locale of `TRANSLATED_GUIDE_LOCALES`, and every other guide in
 * English alone.
 *
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

/** The files of one locale's translation: one per guide, and one for the chrome they share. */
export const GUIDE_UNITS = [...TRANSLATED_GUIDE_SLUGS, "chrome"] as const;

export type GuideUnit = (typeof GUIDE_UNITS)[number];

/** The place an approval of a guide unit names, apart from every article's and page's, so no approval carries over. */
export const approvalNameOf = (unit: string): string => `learn/${unit}`;

/**
 * The locales other than English that serve the guides above. A locale goes in only when every guide and the chrome
 * have a reviewed translation made from the current English text. `npm run build` runs
 * `node scripts/articles-i18n.mjs --guides verify`, which fails on one that is missing, stale or unreviewed.
 */
export const TRANSLATED_GUIDE_LOCALES: readonly Locale[] = ["ru", "pt-BR", "fr", "de", "es"];
