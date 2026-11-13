/**
 * @jest-environment node
 */
import { isSameForEveryVisitor, withWorkersCachePolicy } from "../workersCache";

const PAGE_CACHE = "s-maxage=31536000, stale-while-revalidate=2592000";

function page(cacheControl?: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (cacheControl) headers.set("cache-control", cacheControl);
  return new Response("<html></html>", { ...init, headers });
}

function get(path: string, headers: Record<string, string> = {}, host = "cf-test.thememorychess.com"): Request {
  return new Request(`https://${host}${path}`, { headers });
}

describe("Workers Cache policy", () => {
  test.each(["/", "/game", "/leaderboard", "/daily"])("never stores the locale-negotiated page %s", (path) => {
    expect(isSameForEveryVisitor(path)).toBe(false);
    expect(withWorkersCachePolicy(page(PAGE_CACHE), get(path)).headers.get("cache-control")).toBe("private, no-store");
  });

  test("stores a negotiated page the gateway sent with the locale decided", () => {
    expect(withWorkersCachePolicy(page(PAGE_CACHE), get("/"), true).headers.get("cache-control")).toBe(PAGE_CACHE);
  });

  test("still refuses to store an API response with no Cache-Control when the locale is decided", () => {
    expect(withWorkersCachePolicy(page(), get("/api/game-stats"), true).headers.get("cache-control")).toBe("private, no-store");
  });

  test.each(["/learn", "/changelog", "/de", "/de/leaderboard", "/pt-br/game", "/zh-CN"])("keeps the app's caching for %s", (path) => {
    expect(isSameForEveryVisitor(path)).toBe(true);
    expect(withWorkersCachePolicy(page(PAGE_CACHE), get(path)).headers.get("cache-control")).toBe(PAGE_CACHE);
  });

  test("keeps static files cacheable", () => {
    expect(isSameForEveryVisitor("/_next/static/chunks/app.js")).toBe(true);
    expect(isSameForEveryVisitor("/favicon.ico")).toBe(true);
  });

  test("stops an API response without Cache-Control from being cached by heuristic", () => {
    expect(withWorkersCachePolicy(page(), get("/api/game-stats")).headers.get("cache-control")).toBe("private, no-store");
  });

  test("keeps an API response's own Cache-Control", () => {
    const api = "public, s-maxage=30, stale-while-revalidate=300";
    expect(withWorkersCachePolicy(page(api), get("/api/leaderboard")).headers.get("cache-control")).toBe(api);
  });

  test("never stores a redirect, which may carry one visitor's locale cookie", () => {
    const redirect = page(undefined, { status: 308, headers: { location: "/game" } });
    expect(withWorkersCachePolicy(redirect, get("/en/game")).headers.get("cache-control")).toBe("private, no-store");
  });

  test("never stores OpenNext's regeneration of a page, and keeps it apart from visitors' copies", () => {
    const regenerated = withWorkersCachePolicy(page(PAGE_CACHE), get("/de/daily", { "x-prerender-revalidate": "id" }));
    expect(regenerated.headers.get("cache-control")).toBe("private, no-store");
    expect(withWorkersCachePolicy(page(PAGE_CACHE), get("/de/daily")).headers.get("vary")).toContain("x-prerender-revalidate");
  });

  test("names the production site in the hreflang Link header whichever host filled the cache", () => {
    const link = '<https://memory-chess.bingcheng45.workers.dev/game>; rel="alternate"; hreflang="en"';
    const stored = withWorkersCachePolicy(page(PAGE_CACHE, { headers: { link } }), get("/de/game", {}, "memory-chess.bingcheng45.workers.dev"));
    expect(stored.headers.get("link")).toBe('<https://thememorychess.com/game>; rel="alternate"; hreflang="en"');
  });
});
