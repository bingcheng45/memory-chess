import { LOCALE_LABELS, LOCALES } from "@/i18n/routing";

/** `/de/leaderboard` -> `/leaderboard`; a path without a locale prefix is returned as is. */
export function unprefixedPath(pathname: string): string {
  const [, prefix, ...rest] = pathname.split("/");
  return (LOCALES as readonly string[]).includes(prefix) ? `/${rest.join("/")}` : pathname;
}

/**
 * Routes that exist only in English, each at its bare URL.
 *
 * The long-form editorial pages are written and kept in one language. Serving
 * them under 23 locale prefixes would publish machine-translated or duplicate
 * copies, so a prefixed request redirects to the bare URL, the sitemap lists
 * each once, and links from localized pages point straight at the bare URL.
 * A route here covers every path beneath it.
 */
export const ENGLISH_ONLY_ROUTES = [
  "/about",
  "/privacy",
  "/terms",
  "/changelog",
  "/learn",
] as const;

/**
 * Routes served to readers in every locale but indexed only at their English
 * URL. The translated pages are noindex, so nothing may advertise them: the
 * sitemap lists the English URL once with no alternates, and the middleware
 * drops next-intl's hreflang Link header.
 */
export const DEFAULT_LOCALE_INDEXED_ROUTES = ["/leaderboard"] as const;

/** Whether an unprefixed path is served in every locale but indexed only in English. */
export function isIndexedInDefaultLocaleOnly(path: string): boolean {
  return (DEFAULT_LOCALE_INDEXED_ROUTES as readonly string[]).includes(path);
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
  return ENGLISH_ONLY_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}
