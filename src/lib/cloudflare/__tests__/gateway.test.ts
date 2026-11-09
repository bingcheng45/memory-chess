/**
 * @jest-environment node
 */
import { handleGatewayRequest } from "../gateway";

jest.mock("@/lib/articles/translatedLocales");

const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function recordingApp(name: string, calls: { via: string; request: Request }[]) {
  return {
    fetch: async (request: Request) => {
      calls.push({ via: name, request });
      return new Response("page", { headers: { "cache-control": "s-maxage=31536000" } });
    },
  };
}

async function visit(path: string, headers: Record<string, string>) {
  const calls: { via: string; request: Request }[] = [];
  const response = await handleGatewayRequest(
    new Request(`https://cf-test.thememorychess.com${path}`, { headers: { "user-agent": BROWSER, ...headers } }),
    { app: recordingApp("app", calls), englishApp: recordingApp("englishApp", calls) },
    { waitUntil: () => undefined },
  );
  return { response, calls };
}

describe("Cloudflare gateway", () => {
  test("sends an English visitor's home page to the cacheable English app with the locale fixed", async () => {
    const { calls } = await visit("/", { "accept-language": "en-US,en;q=0.9", cookie: "_ga=1" });
    expect(calls.map((call) => call.via)).toEqual(["englishApp"]);
    expect(calls[0].request.headers.get("cookie")).toBe("NEXT_LOCALE=en");
    expect(calls[0].request.headers.get("accept-language")).toBe("en");
  });

  test("adds back the locale cookie the middleware sets for a visitor whose browser names no language", async () => {
    const { response } = await visit("/game", {});
    expect(response.headers.get("set-cookie")).toContain("NEXT_LOCALE=en");
  });

  test("leaves a German visitor's home page to the app, which redirects to /de", async () => {
    const { calls } = await visit("/", { "accept-language": "de-DE,de;q=0.9" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(calls[0].request.headers.get("accept-language")).toBe("de-DE,de;q=0.9");
  });

  test("respects a saved locale choice over an English browser", async () => {
    const { calls } = await visit("/leaderboard", { "accept-language": "en-US", cookie: "NEXT_LOCALE=fr" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
  });

  test("uses the country hint when the browser language is not one the site ships", async () => {
    const { calls } = await visit("/", { "accept-language": "xx", "cf-ipcountry": "BR" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
  });

  test("serves Googlebot the English page whatever language it sends", async () => {
    const { calls } = await visit("/", { "user-agent": GOOGLEBOT, "accept-language": "hu" });
    expect(calls.map((call) => call.via)).toEqual(["englishApp"]);
  });

  test("records the language of an opened /de link for a visitor whose saved choice was French", async () => {
    const { response, calls } = await visit("/de/game", { "accept-language": "en-US", cookie: "NEXT_LOCALE=fr" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(response.headers.get("set-cookie")).toContain("NEXT_LOCALE=de");
  });

  test.each(["/learn", "/de", "/api/game-stats", "/favicon.ico"])("passes %s straight to the app", async (path) => {
    const { calls } = await visit(path, { "accept-language": "de" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(calls[0].request.headers.get("accept-language")).toBe("de");
  });
});

const STORE_MANIFEST = {
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=31536000, stale-while-revalidate=2592000", "x-frame-options": "DENY" },
  pages: { "/en/about": { "x-nextjs-prerender": "1" }, "/de/game": { "x-nextjs-prerender": "1" }, "/en/game": { "x-nextjs-prerender": "1" } },
};

function pageStore(calls: string[], files: Record<string, string> = { "/en/about": "<p>about</p>", "/de/game": "<p>Spiel</p>", "/en/game": "<p>game</p>" }) {
  return {
    fetch: async (request: Request) => {
      const { pathname } = new URL(request.url);
      calls.push(pathname);
      if (pathname === "/_gateway/pages.json") return Response.json(STORE_MANIFEST);
      const page = files[pathname.replace(/^\/_gateway\/pages/, "").replace(/\.page$/, "")];
      return page === undefined ? new Response("missing", { status: 404 }) : new Response(page);
    },
  };
}

async function visitWithStore(path: string, headers: Record<string, string>, files?: Record<string, string>, method = "GET") {
  const appCalls: { via: string; request: Request }[] = [];
  const storeCalls: string[] = [];
  const response = await handleGatewayRequest(
    new Request(`https://cf-test.thememorychess.com${path}`, { method, headers: { "user-agent": BROWSER, ...headers } }),
    { app: recordingApp("app", appCalls), englishApp: recordingApp("englishApp", appCalls), pages: pageStore(storeCalls, files) },
    { waitUntil: () => undefined },
  );
  return { response, appVia: appCalls.map((call) => call.via), storeCalls };
}

describe("Cloudflare gateway stored pages", () => {
  test("answers an English visitor's /about with the stored HTML and headers, without the app", async () => {
    const { response, appVia } = await visitWithStore("/about", { "accept-language": "en-US,en;q=0.9" });
    expect(appVia).toEqual([]);
    expect(await response.text()).toBe("<p>about</p>");
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-nextjs-prerender")).toBe("1");
    expect(response.headers.get("x-gateway-cache")).toBe("HIT");
  });

  test("answers a /de link with the German page, the site's hreflang links and the locale cookie", async () => {
    const { response, appVia } = await visitWithStore("/de/game", { "accept-language": "en-US", cookie: "NEXT_LOCALE=fr" });
    expect(appVia).toEqual([]);
    expect(await response.text()).toBe("<p>Spiel</p>");
    expect(response.headers.get("set-cookie")).toContain("NEXT_LOCALE=de");
    const link = response.headers.get("link") ?? "";
    expect(link).toContain('<https://thememorychess.com/de/game>; rel="alternate"; hreflang="de"');
    expect(link).not.toContain("cf-test.thememorychess.com");
  });

  test.each(["/about", "/leaderboard"])("tells visitors' caches to revalidate %s every time, stored or not", async (path) => {
    const { response } = await visitWithStore(path, { "accept-language": "en" });
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
  });

  test("still redirects a German visitor's /game through the app", async () => {
    const { appVia } = await visitWithStore("/game", { "accept-language": "de-DE,de;q=0.9" });
    expect(appVia).toEqual(["app"]);
  });

  test.each([
    ["the Next router", { rsc: "1" }],
    ["a segment prefetch", { "next-router-segment-prefetch": "/_tree" }],
    ["a regeneration", { "x-prerender-revalidate": "token" }],
  ])("sends %s to the app", async (_name, headers) => {
    const { appVia } = await visitWithStore("/about", { "accept-language": "en", ...headers });
    expect(appVia).toEqual(["app"]);
  });

  test("sends an _rsc fetch and a HEAD to the app", async () => {
    expect((await visitWithStore("/about?_rsc=abc", { "accept-language": "en" })).appVia).toEqual(["app"]);
    expect((await visitWithStore("/about", { "accept-language": "en" }, undefined, "HEAD")).appVia).toEqual(["app"]);
  });

  test("falls back to the app for a page that is not stored", async () => {
    const { appVia } = await visitWithStore("/leaderboard", { "accept-language": "en" });
    expect(appVia).toEqual(["englishApp"]);
  });

  test("falls back to the app when a listed page's file is missing", async () => {
    const { appVia } = await visitWithStore("/about", { "accept-language": "en" }, {});
    expect(appVia).toEqual(["app"]);
  });

  test("refuses the stored files to visitors", async () => {
    const { response, appVia, storeCalls } = await visitWithStore("/_gateway/pages.json", {});
    expect(response.status).toBe(404);
    expect(appVia).toEqual([]);
    expect(storeCalls).toEqual([]);
  });
});
