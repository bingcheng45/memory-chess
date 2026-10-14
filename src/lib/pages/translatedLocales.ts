import type { Locale } from "@/i18n/routing";

/**
 * The trust pages that may be served in translation. Each name is its route without the slash.
 *
 * This file holds data only. `scripts/articles-i18n/repo.mjs` imports it with Node's type stripping, which cannot
 * follow the `@/` alias at runtime.
 */
export const PAGE_NAMES = ["about", "privacy", "terms"] as const;

export type PageName = (typeof PAGE_NAMES)[number];

export const PAGE_ROUTES = PAGE_NAMES.map((name) => `/${name}` as const);

/**
 * The locales that serve the trust pages in translation. English is the original and is not here.
 *
 * A locale goes in only when all three pages and their chrome have a reviewed translation made from the current
 * English text, so a locale serves all of them or none. `npm run build` runs
 * `node scripts/articles-i18n.mjs --pages verify`, which fails on a page that is missing, stale or unreviewed.
 */
export const TRANSLATED_PAGE_LOCALES: readonly Locale[] = [];
