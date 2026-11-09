/** @jest-environment node */

import { gatewayPage, headersForEveryPath, staticPageCacheFiles } from "../cf-static-page-cache.mjs";

const manifest = {
  routes: {
    "/en": { initialRevalidateSeconds: false },
    "/de/about": { initialRevalidateSeconds: false },
    "/de/leaderboard": { initialRevalidateSeconds: 300 },
    "/sitemap.xml": { initialRevalidateSeconds: false },
  },
};

describe("staticPageCacheFiles", () => {
  it("keeps the pages and routes that never revalidate, and nothing else", () => {
    const files = [
      "build/route-cache/APP_PAGE/aaa/$/en.cache",
      "build/route-cache/APP_PAGE/bbb/$/de/about.cache",
      "build/route-cache/APP_PAGE/ccc/$/de/leaderboard.cache",
      "build/route-cache/APP_PAGE/ddd/$/de/articles/unlisted.cache",
      "build/route-cache/APP_ROUTE/eee/$/sitemap.xml.cache",
      "build/route-cache/APP_PAGE/aaa/$",
      "__fetch/build/0123abcd",
    ];

    expect(staticPageCacheFiles(files, manifest)).toEqual([
      "build/route-cache/APP_PAGE/aaa/$/en.cache",
      "build/route-cache/APP_PAGE/bbb/$/de/about.cache",
      "build/route-cache/APP_ROUTE/eee/$/sitemap.xml.cache",
    ]);
  });
});

describe("gatewayPage", () => {
  const page = { type: "app", html: "<p>about</p>", meta: { headers: { "x-nextjs-prerender": "1", "x-next-cache-tags": "_N_T_/de/about" } } };

  it("keeps the HTML and the page headers, without the cache tags", () => {
    expect(gatewayPage("/de/about", page)).toEqual({ html: "<p>about</p>", headers: { "x-nextjs-prerender": "1" } });
  });

  it("leaves out error pages, internal routes, routes and partly prerendered pages", () => {
    expect(gatewayPage("/de/about", { ...page, meta: { status: 404 } })).toBeNull();
    expect(gatewayPage("/_not-found", page)).toBeNull();
    expect(gatewayPage("/sitemap.xml", { type: "route", body: "<xml/>", meta: {} })).toBeNull();
    expect(gatewayPage("/de/about", { ...page, meta: { postponed: "state" } })).toBeNull();
  });
});

describe("headersForEveryPath", () => {
  it("takes the headers next.config.ts sends on every path, keyed in lower case", () => {
    const routesManifest = {
      headers: [
        { source: "/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
        { source: "/pieces/:path*", headers: [{ key: "Cache-Control", value: "public" }] },
      ],
    };
    expect(headersForEveryPath(routesManifest)).toEqual({ "x-frame-options": "DENY" });
  });
});
