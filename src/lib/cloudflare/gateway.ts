import { NextRequest, type NextFetchEvent } from "next/server";
import middleware from "@/middleware";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { isGatewayFile, renderedPath, storedPage, wantsStoredHtml } from "./gatewayPages";
import { isApiPath, isSameForEveryVisitor, isStaticFile, linkWithSiteOrigin } from "./workersCache";

const LOCALE_COOKIE = "NEXT_LOCALE";
/**
 * `s-maxage` is for the Workers Cache in front of the app. Sent on to visitors,
 * it would let a shared proxy keep a bare page such as `/` for a year and hand
 * one visitor's language to the next. Vercel sends this instead.
 */
const VISITOR_CACHE_CONTROL = "public, max-age=0, must-revalidate";

export interface AppBinding {
  fetch(request: Request): Promise<Response>;
}

export interface GatewayBindings {
  /** The app, reached as visitors reach it. */
  app: AppBinding;
  /** The app, reached with `ctx.props` saying the locale is already decided as English, which lets it cache the page. */
  englishApp: AppBinding;
  /** The app's static assets, which hold the HTML of pages that never change after the build. */
  pages?: AppBinding;
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

async function fromStore(request: Request, decision: Response, pages: AppBinding | undefined): Promise<Response | null> {
  if (!pages || !wantsStoredHtml(request)) return null;
  const path = renderedPath(request, decision);
  const page = path === null ? null : await storedPage(path, pages);
  const link = decision.headers.get("link");
  if (page && link) page.headers.set("link", linkWithSiteOrigin(link, new URL(request.url).origin));
  return page;
}

/**
 * Runs the site's own middleware in front of the cached app, the way Vercel
 * runs it in front of its CDN. A cached page skips the app's middleware, so
 * the cookie it would have set (for example `NEXT_LOCALE=de` on opening a
 * `/de` link) is added here. A bare page such as `/` depends on who asks: an
 * English answer is fetched with the locale fixed, so every English visitor
 * shares one cached copy, and any other answer, such as a redirect to `/de`,
 * goes to the app unchanged. A plain load of a page that never changes after
 * the build is answered with its stored HTML, so the app does not have to
 * start on that machine.
 */
export async function handleGatewayRequest(
  request: Request,
  bindings: GatewayBindings,
  event: Pick<NextFetchEvent, "waitUntil">,
): Promise<Response> {
  if (isGatewayFile(new URL(request.url).pathname)) return new Response("Not Found", { status: 404 });
  if (!isPageRequest(request)) return bindings.app.fetch(request);

  const decision = await middleware(new NextRequest(request), event as NextFetchEvent);
  const isNegotiated = !isSameForEveryVisitor(new URL(request.url).pathname);
  const stored = await fromStore(request, decision, bindings.pages);
  const page = stored
    ?? (isNegotiated && isEnglishPage(decision)
      ? await fetchEnglish(request, bindings.englishApp)
      : await bindings.app.fetch(request));

  const visible = new Response(page.body, page);
  if (visible.headers.get("cache-control")?.includes("s-maxage")) visible.headers.set("cache-control", VISITOR_CACHE_CONTROL);
  if (!visible.headers.has("set-cookie")) {
    for (const cookie of decision.headers.getSetCookie()) visible.headers.append("set-cookie", cookie);
  }
  return visible;
}
