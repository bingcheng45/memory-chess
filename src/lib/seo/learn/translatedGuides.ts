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

export const TRANSLATED_GUIDE_LOCALES: readonly Locale[] = ["ru", "pt-BR", "fr", "de", "es"];
