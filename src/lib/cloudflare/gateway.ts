import { NextRequest, type NextFetchEvent } from "next/server";
import middleware from "@/middleware";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { isApiPath, isSameForEveryVisitor, isStaticFile } from "./workersCache";

const LOCALE_COOKIE = "NEXT_LOCALE";

export interface AppBinding {
  fetch(request: Request): Promise<Response>;
}

export interface GatewayBindings {
  /** The app, reached as visitors reach it. */
  app: AppBinding;
  /** The app, reached with `ctx.props` saying the locale is already decided as English, which lets it cache the page. */
  englishApp: AppBinding;
}

/** A page request, which the middleware would see; API routes and files skip it. */
function isPageRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const { pathname } = new URL(request.url);
  return !isApiPath(pathname) && !isStaticFile(pathname);
}

/** next-intl answers an English visitor on a bare path by rewriting it to the `/en` page. */
function isEnglishPage(decision: Response): boolean {
  const rewrite = decision.headers.get("x-middleware-rewrite");
  if (decision.status !== 200 || !rewrite) return false;
  const [, locale] = new URL(rewrite).pathname.split("/");
  return locale === DEFAULT_LOCALE;
}

function fetchEnglish(request: Request, englishApp: AppBinding): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.set("accept-language", DEFAULT_LOCALE);
  headers.set("cookie", `${LOCALE_COOKIE}=${DEFAULT_LOCALE}`);
  return englishApp.fetch(new Request(request.url, { method: request.method, headers }));
}

/**
 * Runs the site's own middleware in front of the cached app, the way Vercel
 * runs it in front of its CDN. A cached page skips the app's middleware, so
 * the cookie it would have set (for example `NEXT_LOCALE=de` on opening a
 * `/de` link) is added here. A bare page such as `/` depends on who asks: an
 * English answer is fetched with the locale fixed, so every English visitor
 * shares one cached copy, and any other answer, such as a redirect to `/de`,
 * goes to the app unchanged.
 */
export async function handleGatewayRequest(
  request: Request,
  bindings: GatewayBindings,
  event: Pick<NextFetchEvent, "waitUntil">,
): Promise<Response> {
  if (!isPageRequest(request)) return bindings.app.fetch(request);

  const decision = await middleware(new NextRequest(request), event as NextFetchEvent);
  const isNegotiated = !isSameForEveryVisitor(new URL(request.url).pathname);
  const page = isNegotiated && isEnglishPage(decision)
    ? await fetchEnglish(request, bindings.englishApp)
    : await bindings.app.fetch(request);

  const cookies = decision.headers.getSetCookie();
  if (cookies.length === 0 || page.headers.has("set-cookie")) return page;
  const withCookie = new Response(page.body, page);
  for (const cookie of cookies) withCookie.headers.append("set-cookie", cookie);
  return withCookie;
}
