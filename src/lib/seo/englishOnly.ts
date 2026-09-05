/**
 * Routes that serve English on every locale.
 *
 * The privacy policy, about page and terms are one document in one language.
 * Two places act on that fact and they must not disagree: the sitemap lists
 * each once instead of twenty-four times, and the footer links straight to the
 * bare English URL. A locale-aware link would send a German reader to
 * /de/about, which renders the same English text and canonicalises back to
 * /about, so the crawl budget pays for a URL the sitemap deliberately omits.
 */
export const ENGLISH_ONLY_PATHS: ReadonlySet<string> = new Set([
  "/privacy",
  "/about",
  "/terms",
]);

export function isEnglishOnlyPath(path: string): boolean {
  return ENGLISH_ONLY_PATHS.has(path);
}
