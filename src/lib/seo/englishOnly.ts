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

export function isEnglishOnlyPath(path: string): boolean {
  return ENGLISH_ONLY_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}
