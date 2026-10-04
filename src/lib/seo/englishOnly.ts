import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from "@/i18n/routing";
import { servesArticlesIn } from "@/lib/articles/translatedLocales";

const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } } as const;
const ARTICLES_ROUTE = "/articles";

/** `/de/leaderboard` -> `/leaderboard`; a path without a locale prefix is returned as is. */
export function unprefixedPath(pathname: string): string {
  const [, prefix, ...rest] = pathname.split("/");
  return (LOCALES as readonly string[]).includes(prefix) ? `/${rest.join("/")}` : pathname;
}

function isUnder(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`);
}

/**
 * Routes that exist only in English, each at its bare URL.
 *
 * These editorial pages are written and kept in one language. Serving them
 * under 23 locale prefixes would publish machine-translated or duplicate
 * copies, so a prefixed request redirects to the bare URL, the sitemap lists
 * each once, and links from localized pages point straight at the bare URL.
 * A route here covers every path beneath it.
 *
 * The articles were on this list and left it when they were translated. They
 * are in `DEFAULT_LOCALE_INDEXED_ROUTES` now.
 */
export const ENGLISH_ONLY_ROUTES = [
  "/about",
  "/privacy",
  "/terms",
  "/changelog",
  "/learn",
] as const;

/**
 * Routes served to readers in translation but indexed only at their English
 * URL. A translated page is noindex with a canonical to itself, so nothing may
 * advertise it: the sitemap lists the English URL once with no alternates, and
 * the middleware drops next-intl's hreflang Link header. A route here covers
 * every path beneath it.
 *
 * The articles are here because of how they are translated. A translated
 * article is an AI-assisted translation of the English text, checked before it
 * goes up. It is there for readers and is never offered to search: unreviewed
 * machine translations in the sitemap are what got the site rejected by AdSense
 * once. Which locales have translated articles is the list in
 * `@/lib/articles/translatedLocales`.
 */
export const DEFAULT_LOCALE_INDEXED_ROUTES = ["/leaderboard", ARTICLES_ROUTE] as const;

/** Whether an unprefixed path is served in translation but indexed only in English. */
export function isIndexedInDefaultLocaleOnly(path: string): boolean {
  return DEFAULT_LOCALE_INDEXED_ROUTES.some((route) => isUnder(path, route));
}

/** The robots metadata for a page: noindex on a translation of a route indexed only in English. */
export function robotsFor(path: string, locale: string): Metadata["robots"] {
  return isIndexedInDefaultLocaleOnly(path) && locale !== DEFAULT_LOCALE ? NOINDEX_FOLLOW : undefined;
}

/**
 * What a link to an English-only page appends to its label on a translated
 * page, so the reader knows the language changes. Uses the untranslated
 * native name, so no locale needs a new message.
 */
export function englishOnlyLinkSuffix(locale: string): string {
  return locale === "en" ? "" : ` (${LOCALE_LABELS.en})`;
}

export function isEnglishOnlyPath(path: string): boolean {
  return ENGLISH_ONLY_ROUTES.some((route) => isUnder(path, route));
}

/**
 * Whether a reader of `locale` gets this unprefixed path at its bare English
 * URL. True for an English-only route in every locale. True for an article
 * route in English, and in a locale the articles are not translated into. A
 * translated article lives only under its locale prefix, so the bare article
 * URL always answers in English.
 */
export function isServedAtBareEnglishUrl(path: string, locale: string): boolean {
  if (isEnglishOnlyPath(path)) return true;
  return isUnder(path, ARTICLES_ROUTE) && (locale === DEFAULT_LOCALE || !servesArticlesIn(locale));
}
