/** @jest-environment node */

import { staticPageCacheFiles } from "../cf-static-page-cache.mjs";

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
