import { NextRequest, type NextFetchEvent } from "next/server";
import middleware from "@/middleware";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { isSameForEveryVisitor } from "./workersCache";

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

/** Only a bare page such as `/` or `/game` depends on who is asking; everything else goes straight to the app. */
export function needsLocaleDecision(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const { pathname } = new URL(request.url);
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  return !isSameForEveryVisitor(pathname);
}

/** next-intl answers an English visitor on a bare path by rewriting it to the `/en` page. */
function isEnglishPage(decision: Response): boolean {
  const rewrite = decision.headers.get("x-middleware-rewrite");
  if (decision.status !== 200 || !rewrite) return false;
  const [, locale] = new URL(rewrite).pathname.split("/");
  return locale === DEFAULT_LOCALE;
}

/**
 * Runs the site's own middleware to decide the locale, the way Vercel runs it
 * in front of its CDN. An English page is fetched with the locale fixed, so
 * every English visitor gets the same cacheable response; the cookie the
 * middleware would have set is added back here. Any other outcome, such as a
 * redirect to `/de`, goes to the app unchanged.
 */
export async function handleGatewayRequest(
  request: Request,
  bindings: GatewayBindings,
  event: Pick<NextFetchEvent, "waitUntil">,
): Promise<Response> {
  if (!needsLocaleDecision(request)) return bindings.app.fetch(request);

  const decision = await middleware(new NextRequest(request), event as NextFetchEvent);
  if (!isEnglishPage(decision)) return bindings.app.fetch(request);

  const headers = new Headers(request.headers);
  headers.set("accept-language", DEFAULT_LOCALE);
  headers.set("cookie", `${LOCALE_COOKIE}=${DEFAULT_LOCALE}`);
  const page = await bindings.englishApp.fetch(new Request(request.url, { method: request.method, headers }));

  const cookies = decision.headers.getSetCookie();
  if (cookies.length === 0) return page;
  const withCookie = new Response(page.body, page);
  for (const cookie of cookies) withCookie.headers.append("set-cookie", cookie);
  return withCookie;
}
