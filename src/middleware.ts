import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing, LOCALES } from "@/i18n/routing";
import { isCrawler, localeForCountry } from "@/i18n/countryLocale";

const handleI18nRouting = createMiddleware(routing);

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Does `Accept-Language` name any locale we actually ship?
 *
 * Only the language subtag is compared, so `pt-PT` counts as a hit for `pt-BR`
 * and `de-AT` for `de` -- next-intl's matcher will resolve the exact variant.
 * A visitor asking for a language we do not have (say `nl`) counts as a miss,
 * which is what lets the country hint step in.
 */
function hasSupportedLanguage(acceptLanguage: string | null): boolean {
  if (!acceptLanguage) return false;

  const requested = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  return requested.some((tag) => {
    const language = tag.split("-")[0];
    return LOCALES.some(
      (locale) => locale.toLowerCase().split("-")[0] === language,
    );
  });
}

export default function middleware(request: NextRequest) {
  // Priority: an explicit choice (cookie) > the browser's stated preference
  // (Accept-Language) > where the request appears to come from (geo) >
  // English. next-intl already handles the first two, so this only fills the
  // gap when both are silent.
  const hasExplicitChoice = request.cookies.has(LOCALE_COOKIE);
  const acceptLanguage = request.headers.get("accept-language");

  const shouldUseCountryHint =
    !hasExplicitChoice &&
    !hasSupportedLanguage(acceptLanguage) &&
    !isCrawler(request.headers.get("user-agent"));

  if (shouldUseCountryHint) {
    // Vercel and Cloudflare expose the edge geo country under different
    // headers; `request.geo` is not populated outside Vercel's runtime.
    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry");

    const hinted = localeForCountry(country);

    if (hinted) {
      // Hand next-intl a header it already knows how to negotiate, rather than
      // duplicating its matching and redirect logic here.
      const headers = new Headers(request.headers);
      headers.set("accept-language", hinted);

      return handleI18nRouting(
        new NextRequest(request.url, { headers, method: request.method }),
      );
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  /**
   * Run on every path except API routes, Next internals, and any request that
   * looks like a static file. `sitemap.xml` and `robots.txt` are excluded
   * explicitly: they are single-origin documents that already enumerate every
   * locale themselves, so a locale redirect on them would be wrong.
   */
  matcher: ["/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|.*\\..*).*)"],
};
