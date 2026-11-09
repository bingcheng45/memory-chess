import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

const UNCACHEABLE = "private, no-store";
const LOCALE_PREFIXES = new Set(LOCALES.map((locale) => locale.toLowerCase()));

/**
 * Workers Cache answers a hit before the Worker runs, so the middleware's
 * locale negotiation never sees it. Only a response that is the same for
 * every visitor may be stored: one under a locale prefix, at an English-only
 * URL, or a static file. A bare path such as `/` or `/game` redirects on the
 * visitor's cookie, Accept-Language and country, so it must never be stored.
 */
export function isSameForEveryVisitor(pathname: string): boolean {
  if (pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(pathname)) return true;

  const [, first = ""] = pathname.split("/");
  if (LOCALE_PREFIXES.has(first.toLowerCase())) return true;

  return isServedAtBareEnglishUrl(pathname, DEFAULT_LOCALE);
}

/** An API response without its own Cache-Control would otherwise be cached for 2 hours by heuristic freshness. */
export function withWorkersCachePolicy(response: Response, pathname: string): Response {
  const isApi = pathname === "/api" || pathname.startsWith("/api/");
  const mustNotStore = isApi ? !response.headers.has("cache-control") : !isSameForEveryVisitor(pathname);
  if (!mustNotStore) return response;

  const guarded = new Response(response.body, response);
  guarded.headers.set("cache-control", UNCACHEABLE);
  return guarded;
}
