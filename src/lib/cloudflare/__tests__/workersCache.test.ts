/**
 * @jest-environment node
 */
import { isSameForEveryVisitor, withWorkersCachePolicy } from "../workersCache";

const PAGE_CACHE = "s-maxage=31536000, stale-while-revalidate=2592000";

function page(cacheControl?: string): Response {
  return new Response("<html></html>", { headers: cacheControl ? { "cache-control": cacheControl } : {} });
}

describe("Workers Cache policy", () => {
  test.each(["/", "/game", "/leaderboard", "/daily"])("never stores the locale-negotiated page %s", (path) => {
    expect(isSameForEveryVisitor(path)).toBe(false);
    expect(withWorkersCachePolicy(page(PAGE_CACHE), path).headers.get("cache-control")).toBe("private, no-store");
  });

  test.each(["/learn", "/changelog", "/de", "/de/leaderboard", "/pt-br/game", "/zh-CN"])("keeps the app's caching for %s", (path) => {
    expect(isSameForEveryVisitor(path)).toBe(true);
    expect(withWorkersCachePolicy(page(PAGE_CACHE), path).headers.get("cache-control")).toBe(PAGE_CACHE);
  });

  test("keeps static files cacheable", () => {
    expect(isSameForEveryVisitor("/_next/static/chunks/app.js")).toBe(true);
    expect(isSameForEveryVisitor("/favicon.ico")).toBe(true);
  });

  test("stops an API response without Cache-Control from being cached by heuristic", () => {
    expect(withWorkersCachePolicy(page(), "/api/game-stats").headers.get("cache-control")).toBe("private, no-store");
  });

  test("keeps an API response's own Cache-Control", () => {
    const api = "public, s-maxage=30, stale-while-revalidate=300";
    expect(withWorkersCachePolicy(page(api), "/api/leaderboard").headers.get("cache-control")).toBe(api);
  });
});
