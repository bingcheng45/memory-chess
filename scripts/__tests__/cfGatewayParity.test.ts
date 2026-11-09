/** @jest-environment node */

import { differences, publicPath } from "../cf-gateway-parity.mjs";

const APP_ORIGIN = "https://memory-chess.example.workers.dev";

function answer(headers: Record<string, string>, bodyHash = "abc", status = 200) {
  return { status, bodyHash, headers };
}

describe("publicPath", () => {
  it("drops the English prefix and keeps every other locale", () => {
    expect(publicPath("/en")).toBe("/");
    expect(publicPath("/en/learn/chess-coordinates-practice")).toBe("/learn/chess-coordinates-practice");
    expect(publicPath("/de/game")).toBe("/de/game");
  });
});

describe("differences", () => {
  const stored = { "cache-control": "public, max-age=0, must-revalidate", vary: "RSC", "x-gateway-cache": "HIT" };

  it("finds none when only per-hop headers and the app's own Link origin differ", () => {
    const gateway = answer({ ...stored, date: "1", link: `<https://thememorychess.com/de/game>; rel="alternate"` });
    const app = answer({ "cache-control": "s-maxage=31536000", vary: "RSC", date: "2", "x-middleware-set-cookie": "x", link: `<${APP_ORIGIN}/de/game>; rel="alternate"` });
    expect(differences(gateway, app, APP_ORIGIN)).toEqual([]);
  });

  it("reports a different body, status or header, and a page the app served instead of the gateway", () => {
    const gateway = answer({ "cache-control": "public, max-age=0, must-revalidate", vary: "RSC", "x-frame-options": "DENY" }, "abc", 404);
    const app = answer({ "cache-control": "s-maxage=31536000", vary: "RSC" }, "def", 200);
    expect(differences(gateway, app, APP_ORIGIN)).toEqual([
      "status 404 vs 200",
      "body differs",
      'x-frame-options: gateway "DENY" vs app undefined',
      "not served by the gateway",
    ]);
  });

  it("reports a page that would let shared caches keep it", () => {
    const app = answer({ "cache-control": "s-maxage=31536000", vary: "RSC" });
    expect(differences(answer({ ...stored, "cache-control": "s-maxage=31536000" }), app, APP_ORIGIN)).toEqual([
      'cache-control: gateway "s-maxage=31536000", expected "public, max-age=0, must-revalidate"',
    ]);
  });

  it("expects a redirect from the app, not the gateway", () => {
    const redirect = answer({ location: "/learn" }, "abc", 308);
    expect(differences(redirect, redirect, APP_ORIGIN)).toEqual([]);
  });

  it("does not compare caching headers for a bare page the app, asked straight, will not let anyone store", () => {
    const app = answer({ "cache-control": "private, no-store" });
    expect(differences(answer(stored), app, APP_ORIGIN)).toEqual([]);
  });
});
