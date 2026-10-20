import { trackAgents } from "@databuddy/sdk/agents";
import createMiddleware from "next-intl/middleware";
import { type NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { routing, LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { chineseLocaleFor } from "@/i18n/chineseLocale";
import { isCrawler, localeForCountry } from "@/i18n/countryLocale";
import {
  alternatesLinkHeader,
  isIndexedInDefaultLocaleOnly,
  isPartlyTranslatedPath,
  isServedAtBareEnglishUrl,
  isWithheldTranslation,
  unprefixedPath,
} from "@/lib/seo/englishOnly";
import { resolveRetiredLearnPath } from "@/lib/seo/learn/retired";
import { localizedPath } from "@/lib/seo/alternates";

const handleI18nRouting = createMiddleware(routing);

const LOCALE_COOKIE = "NEXT_LOCALE";

/** `/de/learn/x` -> `/learn/x` when that prefix's readers get the page at its bare English URL. */
function bareEnglishPath(pathname: string): string | null {
  const bare = unprefixedPath(pathname);
  if (bare === pathname) return null;

  const [, locale] = pathname.split("/");
  return isServedAtBareEnglishUrl(bare, locale) ? bare : null;
}

/**
 * next-intl sends an unprefixed path to the cookie or Accept-Language locale.
 * For an English-only route that is a redirect back to the prefixed URL the
 * visitor was just redirected away from: an infinite loop. For an article it
 * would move the indexed English URL to a translation. Negotiating with no
 * locale cookie and an English header makes next-intl rewrite to the default
 * locale instead. The visitor's own cookie survives, because next-intl only
 * writes one when the resolved locale differs from the request's preference,
 * and here they agree.
 * The hreflang Link header is dropped since these routes have no alternates
 * to advertise.
 */
function routeAsDefaultLocale(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("accept-language", DEFAULT_LOCALE);

  const forwarded = new NextRequest(request.url, {
    headers,
    method: request.method,
  });
  forwarded.cookies.delete(LOCALE_COOKIE);

  const response = handleI18nRouting(forwarded);
  response.headers.delete("Link");
  return response;
}

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

/** Markdown and text files, which AI crawlers read most. The matcher admits them only so they are counted. */
const AGENT_FILE = /\.(?:md|txt)$/;

export default function middleware(request: NextRequest, event?: NextFetchEvent) {
  // AI crawlers run no JavaScript, so the browser tracker never sees them.
  if (process.env.VERCEL_ENV === "production") event?.waitUntil(trackAgents(request));
  if (AGENT_FILE.test(request.nextUrl.pathname)) return NextResponse.next();

  const response = route(request);
  // next-intl advertises every locale in a hreflang Link header. For a route
  // indexed only in English that would point crawlers at noindex pages, and for
  // a route served in a few locales at URLs that redirect. The page's own
  // <link rel="alternate"> tags list the locales that exist.
  const path = unprefixedPath(request.nextUrl.pathname);
  if (isIndexedInDefaultLocaleOnly(path) || isPartlyTranslatedPath(path)) {
    const prefix = request.nextUrl.pathname.split("/")[1];
    const locale = path === request.nextUrl.pathname ? DEFAULT_LOCALE : prefix;
    const link = response.status < 300 ? alternatesLinkHeader(path, locale, request.nextUrl.origin) : null;
    if (link) response.headers.set("Link", link);
    else response.headers.delete("Link");
  }
  return response;
}

/** Pages taken down, by unprefixed path, each sent to its replacement in the reader's locale. */
const RETIRED_PAGES: Readonly<Record<string, string>> = {
  // It held only the board coordinates switch, and coordinates are now always shown.
  "/settings": "/game",
};

function retiredPagePath(pathname: string): string | null {
  const bare = unprefixedPath(pathname);
  const target = RETIRED_PAGES[bare];
  if (!target) return null;
  return localizedPath(target, bare === pathname ? DEFAULT_LOCALE : pathname.split("/")[1]);
}

const SHORT_CODES: ReadonlySet<string> = new Set(["pt", "zh"]);

/** The language a `/en`, `/pt` or `/zh` prefix stands for, or null for any other path. */
function localeOfPrefix(request: NextRequest): Locale | null {
  const prefix = request.nextUrl.pathname.split("/")[1];
  if (prefix === DEFAULT_LOCALE) return DEFAULT_LOCALE;
  if (prefix === "pt") return "pt-BR";
  if (prefix !== "zh") return null;
  return chineseLocaleFor(request.headers.get("accept-language"), request.cookies.get(LOCALE_COOKIE)?.value);
}

function withCanonicalLocalePrefix(pathname: string, prefixLocale: Locale | null): string {
  const [, prefix, ...rest] = pathname.split("/");
  if (prefix === DEFAULT_LOCALE) return `/${rest.join("/")}`;
  return prefixLocale && SHORT_CODES.has(prefix) ? ["", prefixLocale, ...rest].join("/") : pathname;
}

/**
 * The one URL a path should answer at: no trailing slash, a retired page's or guide's
 * replacement, and no locale prefix on a page that prefix's readers get at
 * its bare English URL. Resolving all three together keeps every redirect to
 * a single hop.
 */
function canonicalPath(pathname: string, prefixLocale: Locale | null): string {
  const trimmed = withCanonicalLocalePrefix(pathname.replace(/\/+$/, "") || "/", prefixLocale);
  return retiredPagePath(trimmed) ?? resolveRetiredLearnPath(trimmed) ?? bareEnglishPath(trimmed) ?? trimmed;
}

/**
 * Opening a prefixed URL is a language choice that next-intl used to record
 * before these redirects answered first. Asking next-intl about the prefix
 * itself yields the cookie it would have set, under its own rules.
 */
function withLocaleChoice(redirect: NextResponse, request: NextRequest, locale: Locale) {
  const probeUrl = new URL(request.url);
  probeUrl.pathname = `/${locale}`;
  const probe = handleI18nRouting(new NextRequest(probeUrl, { headers: request.headers }));

  for (const cookie of probe.headers.getSetCookie()) redirect.headers.append("set-cookie", cookie);
  return redirect;
}

function route(request: NextRequest) {
  const crawler = isCrawler(request.headers.get("user-agent"));
  const prefixLocale = localeOfPrefix(request);
  const canonical = canonicalPath(request.nextUrl.pathname, prefixLocale);
  if (canonical !== request.nextUrl.pathname) {
    // NextURL puts the request's trailing slash back on any pathname it is given.
    const url = new URL(request.url);
    url.pathname = canonical;
    const isWithheld = isWithheldTranslation(canonical, prefixLocale ?? request.nextUrl.pathname.split("/")[1]);
    const redirect = NextResponse.redirect(url, isWithheld ? 307 : 308);
    return prefixLocale && !crawler ? withLocaleChoice(redirect, request, prefixLocale) : redirect;
  }

  if (isServedAtBareEnglishUrl(request.nextUrl.pathname, DEFAULT_LOCALE)) {
    return routeAsDefaultLocale(request);
  }

  // Priority: an explicit choice (cookie) > the browser's stated preference
  // (Accept-Language) > where the request appears to come from (geo) >
  // English. next-intl already handles the first two, so this only fills the
  // gap when both are silent.
  const hasExplicitChoice = request.cookies.has(LOCALE_COOKIE);
  const acceptLanguage = request.headers.get("accept-language");

  // Crawlers get the URL they asked for. Google's guidance for locale-adaptive
  // sites is to let hreflang do the routing rather than redirect on a header,
  // and Googlebot does crawl with varying `Accept-Language` values -- without
  // this, a crawl of `/` carrying `Accept-Language: hu` would 307 to `/hu` and
  // the canonical English home would answer redirects instead of content. A
  // locale prefix in the path still wins, so `/hu` is unaffected.
  if (crawler && !hasExplicitChoice) {
    const headers = new Headers(request.headers);
    headers.set("accept-language", DEFAULT_LOCALE);

    return handleI18nRouting(
      new NextRequest(request.url, { headers, method: request.method }),
    );
  }

  const shouldUseCountryHint =
    !hasExplicitChoice && !hasSupportedLanguage(acceptLanguage);

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
   * locale themselves, so a locale redirect on them would be wrong. Next
   * matches this against the path with its trailing slash removed, so a slashed
   * skipped path is redirected in next.config.ts instead. The second pattern
   * admits `.md` and `.txt` files, robots.txt included, so AI crawler reads
   * of them are counted; the middleware passes them through untouched.
   */
  matcher: ["/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|.*\\..*).*)", "/((?!_next/).*\\.(?:md|txt))"],
};
