import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo/alternates";
import { isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

const UNCACHEABLE = "private, no-store";
const LOCALE_PREFIXES = new Set(LOCALES.map((locale) => locale.toLowerCase()));
const SITE_ORIGIN = new URL(localizedUrl("/", DEFAULT_LOCALE)).origin;
/** OpenNext regenerates a page by requesting it with this header; it must reach the Worker, never a cached copy. */
const REGENERATION_HEADER = "x-prerender-revalidate";

export function isStaticFile(pathname: string): boolean {
  return pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(pathname);
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/**
 * Workers Cache answers a hit before the Worker runs, so the middleware's
 * locale negotiation never sees it. Only a response that is the same for
 * every visitor may be stored: one under a locale prefix, at an English-only
 * URL, or a static file. A bare path such as `/` or `/game` redirects on the
 * visitor's cookie, Accept-Language and country, so it must never be stored.
 */
export function isSameForEveryVisitor(pathname: string): boolean {
  if (isStaticFile(pathname)) return true;

  const [, first = ""] = pathname.split("/");
  if (LOCALE_PREFIXES.has(first.toLowerCase())) return true;

  return isServedAtBareEnglishUrl(pathname, DEFAULT_LOCALE);
}

function mustNotStore(response: Response, request: Request, pathname: string, localeDecided: boolean): boolean {
  if (request.headers.has(REGENERATION_HEADER)) return true;
  // A redirect can carry the locale cookie for one visitor and not the next.
  if (response.status >= 300 && response.status < 400) return true;
  // Without its own Cache-Control an API response would be kept 2 hours by heuristic freshness.
  if (isApiPath(pathname)) return !response.headers.has("cache-control");
  return !localeDecided && !isSameForEveryVisitor(pathname);
}

/**
 * Marks what Workers Cache must not store, and makes what it may store the
 * same whichever host asked: the cache key leaves out the host, and the
 * middleware writes the request's origin into the hreflang `Link` header.
 * `localeDecided` is true only for a request the gateway sent with the locale
 * fixed as English, which arrives with its own `ctx.props` and so under its
 * own cache key.
 */
export function withWorkersCachePolicy(response: Response, request: Request, localeDecided = false): Response {
  const url = new URL(request.url);
  const guarded = new Response(response.body, response);

  if (mustNotStore(response, request, url.pathname, localeDecided)) {
    guarded.headers.set("cache-control", UNCACHEABLE);
    return guarded;
  }

  const link = guarded.headers.get("link");
  if (link && url.origin !== SITE_ORIGIN) guarded.headers.set("link", link.replaceAll(`<${url.origin}`, `<${SITE_ORIGIN}`));
  guarded.headers.append("vary", REGENERATION_HEADER);
  return guarded;
}
