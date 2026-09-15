import { LOCALE_LABELS } from "@/i18n/routing";

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
