import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from "@/i18n/routing";
import { ARTICLES_PATH } from "@/lib/articles/paths";
import { localizedPath } from "@/lib/seo/alternates";
import { TRANSLATED_ARTICLE_LOCALES } from "@/lib/articles/translatedLocales";
import { PAGE_ROUTES, TRANSLATED_PAGE_LOCALES } from "@/lib/pages/translatedLocales";
import SERVED_GUIDES from "@/lib/seo/learn/servedGuides.json";
import { TRANSLATED_GUIDE_LOCALES, TRANSLATED_GUIDE_SLUGS, isIndexedGuideLocale } from "@/lib/seo/learn/translatedGuides";

const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } } as const;

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
 * The articles and the trust pages (/about, /privacy, /terms) are not here.
 * They are translated, so they are in `DEFAULT_LOCALE_INDEXED_ROUTES`. Five
 * guides under /learn are translated too, and `TRANSLATED_ROUTES` covers them
 * before this list does.
 */
export const ENGLISH_ONLY_ROUTES = ["/changelog", "/learn"] as const;

/**
 * Routes served only at their bare English URL but kept out of search and the footer: a shared card's page exists
 * for the people its link was posted to, and its preview image is drawn in English.
 */
export const UNLISTED_ROUTES = ["/share"] as const;

/**
 * Routes served to readers in translation but indexed only at their English
 * URL. A translated page is noindex with a canonical to itself, so nothing may
 * advertise it: the sitemap lists the English URL once with no alternates, and
 * the middleware drops next-intl's hreflang Link header. A route here covers
 * every path beneath it.
 *
 * A translated article is an AI-assisted translation that a reviewer checked.
 * It is there for readers and is never offered to search, because unreviewed
 * machine translations in the sitemap got the site rejected by AdSense once.
 * `TRANSLATED_ARTICLE_LOCALES` says which locales have translated articles,
 * and `TRANSLATED_PAGE_LOCALES` which have the trust pages. A translated
 * Learn guide is served the same way while its locale is not indexed, which
 * `TRANSLATED_ROUTES` decides.
 */
export const DEFAULT_LOCALE_INDEXED_ROUTES = ["/leaderboard", "/data", ARTICLES_PATH, ...PAGE_ROUTES] as const;

/** Whether an unprefixed path is served in translation but indexed only in English. */
export function isIndexedInDefaultLocaleOnly(path: string): boolean {
  return DEFAULT_LOCALE_INDEXED_ROUTES.some((route) => isUnder(path, route));
}

/** The robots metadata for a page: noindex on a translation search may not index. */
export function robotsFor(path: string, locale: string): Metadata["robots"] {
  return locale !== DEFAULT_LOCALE && !indexedLocalesOf(path).includes(locale) ? NOINDEX_FOLLOW : undefined;
}

/**
 * What a link to an English-only page appends to its label on a translated
 * page, so the reader knows the language changes. Uses the untranslated
 * native name, so no locale needs a new message.
 */
export function englishOnlyLinkSuffix(locale: string): string {
  return locale === "en" ? "" : ` (${LOCALE_LABELS.en})`;
}

/** Whether a path is read in English alone: an English-only route, or a translated route no locale serves yet. */
export function isEnglishOnlyPath(path: string): boolean {
  const translated = translatedRouteOf(path);
  if (translated) return translated.served.length === 0;
  return ENGLISH_ONLY_ROUTES.some((route) => isUnder(path, route));
}

type TranslatedRoute = {
  readonly route: string;
  /** The locales other than English that serve the route. */
  readonly served: readonly string[];
  /** The served locales search may index. */
  readonly indexed: readonly string[];
  /** The locales whose translation is held back until it is approved again, and which redirect to English meanwhile. */
  readonly withheld: readonly string[];
};

const servedGuideLocales: Readonly<Record<string, readonly string[]>> = SERVED_GUIDES;

function guideRoute(slug: string): TranslatedRoute {
  const served = servedGuideLocales[slug] ?? [];
  return {
    route: `/learn/${slug}`,
    served,
    indexed: served.filter(isIndexedGuideLocale),
    withheld: TRANSLATED_GUIDE_LOCALES.filter((locale) => !served.includes(locale)),
  };
}

/**
 * The routes served in translation. This table is the only place that says which locale reads which route in its
 * own language and which of those search may index; the redirects, the links, the language switcher, the robots,
 * the hreflang, the sitemap and the Lab Paper shell all derive from it. A route here covers every path beneath it.
 *
 * A translated article or trust page is never indexed. A translated guide is indexed only when its locale is
 * `indexed: true` in `GUIDE_LOCALE_INDEXING`, and served only while `servedGuides.json`, which the build writes,
 * lists it as current and approved.
 */
const TRANSLATED_ROUTES: readonly TranslatedRoute[] = [
  { route: ARTICLES_PATH, served: TRANSLATED_ARTICLE_LOCALES, indexed: [], withheld: [] },
  ...PAGE_ROUTES.map((route) => ({ route, served: TRANSLATED_PAGE_LOCALES, indexed: [], withheld: [] })),
  ...TRANSLATED_GUIDE_SLUGS.map(guideRoute),
];

const translatedRouteOf = (path: string) => TRANSLATED_ROUTES.find(({ route }) => isUnder(path, route));

export function isPartlyTranslatedPath(path: string): boolean {
  return translatedRouteOf(path) !== undefined;
}

/** The locales search may index an unprefixed path in, English first. */
export function indexedLocalesOf(path: string): readonly string[] {
  if (isIndexedInDefaultLocaleOnly(path)) return [DEFAULT_LOCALE];
  const translated = translatedRouteOf(path);
  if (translated) return [DEFAULT_LOCALE, ...translated.indexed];
  return isEnglishOnlyPath(path) ? [DEFAULT_LOCALE] : LOCALES;
}

/**
 * The hreflang Link header of an unprefixed path, naming the locales search may index it in, or null when that is
 * English alone. next-intl's own header names every locale, which is right only for a page served in all of them.
 */
export function alternatesLinkHeader(path: string, origin: string): string | null {
  const locales = indexedLocalesOf(path);
  if (locales.length < 2) return null;
  const alternates = [...locales.map((locale) => [locale, localizedPath(path, locale)]), ["x-default", path]];
  return alternates.map(([hreflang, href]) => `<${origin}${href}>; rel="alternate"; hreflang="${hreflang}"`).join(", ");
}

/** Whether `locale`'s translation of a path is held back for now, so its prefixed URL redirects to English temporarily. */
export function isWithheldTranslation(path: string, locale: string): boolean {
  return translatedRouteOf(path)?.withheld.includes(locale) ?? false;
}

/** The locales that serve an unprefixed path of a route in `TRANSLATED_ROUTES`, English first; English alone outside it. */
export function servedLocalesOf(path: string): readonly string[] {
  return [DEFAULT_LOCALE, ...(translatedRouteOf(path)?.served ?? [])];
}

/**
 * Whether a reader of `locale` gets this unprefixed path at its bare English
 * URL. A translation lives only under its locale prefix, so the bare URL of a
 * translated route always answers in English.
 */
export function isServedAtBareEnglishUrl(path: string, locale: string): boolean {
  if (isEnglishOnlyPath(path) || UNLISTED_ROUTES.some((route) => isUnder(path, route))) return true;
  return isPartlyTranslatedPath(path) && (locale === DEFAULT_LOCALE || !servedLocalesOf(path).includes(locale));
}
