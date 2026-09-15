/**
 * NextRequest needs the Web Fetch globals (Request, Response, Headers),
 * which the default jsdom environment does not provide.
 *
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Records what the middleware hands to next-intl. `jest.mock` factories are
// hoisted above this declaration, so the name has to start with `mock` and the
// factory may only read it at call time, not while it is being built.
const mockForwarded: NextRequest[] = [];

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => (request: NextRequest) => {
    mockForwarded.push(request);
    return new Response(null, {
      status: 200,
      headers: { Link: '<https://thememorychess.com/de>; rel="alternate"; hreflang="de"' },
    });
  },
}));

import middleware from "@/middleware";

const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

/** Runs the middleware and returns the request it forwarded to next-intl. */
function forwardedRequest(
  headers: Record<string, string>,
  cookie?: string,
): NextRequest {
  const request = new NextRequest("https://thememorychess.com/", {
    headers: new Headers(headers),
  });
  if (cookie) request.cookies.set("NEXT_LOCALE", cookie);

  middleware(request);

  expect(mockForwarded).toHaveLength(1);
  return mockForwarded[0];
}

beforeEach(() => {
  mockForwarded.length = 0;
});

describe("middleware on English-only routes", () => {
  function run(url: string, headers: Record<string, string> = {}, cookie?: string) {
    const request = new NextRequest(url, { headers: new Headers(headers) });
    if (cookie) request.cookies.set("NEXT_LOCALE", cookie);
    return middleware(request);
  }

  it.each([
    ["https://thememorychess.com/de/about", "https://thememorychess.com/about"],
    ["https://thememorychess.com/ja/learn", "https://thememorychess.com/learn"],
    [
      "https://thememorychess.com/pt-BR/learn/chess-memory-training?ref=x",
      "https://thememorychess.com/learn/chess-memory-training?ref=x",
    ],
    ["https://thememorychess.com/en/changelog", "https://thememorychess.com/changelog"],
  ])("permanently redirects %s to the bare URL", (from, to) => {
    const response = run(from);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(to);
    expect(mockForwarded).toHaveLength(0);
  });

  it("sends a prefixed retired guide straight to the guide that absorbed it in one 308", () => {
    const response = run("https://thememorychess.com/de/learn/chess-board-vision-drills");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://thememorychess.com/learn/how-to-stop-blundering-in-chess",
    );
    expect(mockForwarded).toHaveLength(0);
  });

  it("leaves prefixed localized routes to next-intl", () => {
    run("https://thememorychess.com/de/game");
    run("https://thememorychess.com/de/learning");

    expect(mockForwarded).toHaveLength(2);
  });

  it("negotiates a bare English-only route as English whatever the visitor prefers", () => {
    // A German cookie would otherwise send /about to /de/about, which
    // redirects back to /about.
    run(
      "https://thememorychess.com/learn/chess-memory-training",
      { "accept-language": "de-DE,de;q=0.9", "user-agent": BROWSER, "x-vercel-ip-country": "DE" },
      "de",
    );

    expect(mockForwarded).toHaveLength(1);
    expect(mockForwarded[0].headers.get("accept-language")).toBe("en");
    expect(mockForwarded[0].cookies.has("NEXT_LOCALE")).toBe(false);
  });
});

describe("middleware on a trailing slash", () => {
  it.each([
    ["https://thememorychess.com/fr/learn/?utm=1", "https://thememorychess.com/learn?utm=1"],
    ["https://thememorychess.com/de/about/", "https://thememorychess.com/about"],
    [
      "https://thememorychess.com/de/learn/chess-board-vision-drills/?utm=xyz",
      "https://thememorychess.com/learn/how-to-stop-blundering-in-chess?utm=xyz",
    ],
    ["https://thememorychess.com/learn/", "https://thememorychess.com/learn"],
    ["https://thememorychess.com/de/game/", "https://thememorychess.com/de/game"],
    ["https://thememorychess.com/leaderboard//", "https://thememorychess.com/leaderboard"],
  ])("sends %s to its canonical URL in one 308", (from, to) => {
    const response = middleware(new NextRequest(from, { headers: new Headers({ "user-agent": BROWSER }) }));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(to);
    expect(mockForwarded).toHaveLength(0);
  });

  it("leaves the root path to next-intl", () => {
    const response = middleware(
      new NextRequest("https://thememorychess.com/", { headers: new Headers({ "user-agent": GOOGLEBOT }) }),
    );

    expect(response.status).toBe(200);
    expect(mockForwarded).toHaveLength(1);
  });
});

describe("middleware on the English-indexed leaderboard", () => {
  it.each([
    "https://thememorychess.com/leaderboard",
    "https://thememorychess.com/de/leaderboard",
    "https://thememorychess.com/ja/leaderboard?player=ada",
  ])("serves %s through next-intl without the hreflang Link header", (url) => {
    const response = middleware(new NextRequest(url, { headers: new Headers({ "user-agent": BROWSER }) }));

    expect(mockForwarded).toHaveLength(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("Link")).toBeNull();
  });

  it("keeps the Link header on routes indexed in every locale", () => {
    const response = middleware(
      new NextRequest("https://thememorychess.com/de/game", { headers: new Headers({ "user-agent": BROWSER }) }),
    );

    expect(response.headers.get("Link")).toContain('hreflang="de"');
  });
});

describe("middleware locale negotiation", () => {
  it("pins crawlers to the default locale so they get the URL they asked for", () => {
    // Googlebot crawls with varying Accept-Language values. Redirecting on that
    // header would make the canonical English home answer redirects instead of
    // content, so the header is overridden before next-intl negotiates.
    const forwarded = forwardedRequest({
      "accept-language": "hu-HU,hu;q=0.9",
      "user-agent": GOOGLEBOT,
    });

    expect(forwarded.headers.get("accept-language")).toBe("en");
  });

  it("does not let the country hint move a crawler either", () => {
    const forwarded = forwardedRequest({
      "user-agent": GOOGLEBOT,
      "x-vercel-ip-country": "DE",
    });

    expect(forwarded.headers.get("accept-language")).toBe("en");
  });

  it("still negotiates Accept-Language for real visitors", () => {
    const forwarded = forwardedRequest({
      "accept-language": "hu-HU,hu;q=0.9",
      "user-agent": BROWSER,
    });

    expect(forwarded.headers.get("accept-language")).toBe("hu-HU,hu;q=0.9");
  });

  it("falls back to the country hint when Accept-Language names no shipped locale", () => {
    const forwarded = forwardedRequest({
      "accept-language": "af-ZA,af;q=0.9",
      "user-agent": BROWSER,
      "x-vercel-ip-country": "DE",
    });

    expect(forwarded.headers.get("accept-language")).toBe("de");
  });

  it("leaves an explicit cookie choice alone for visitors", () => {
    const forwarded = forwardedRequest(
      {
        "accept-language": "af-ZA",
        "user-agent": BROWSER,
        "x-vercel-ip-country": "DE",
      },
      "ja",
    );

    expect(forwarded.headers.get("accept-language")).toBe("af-ZA");
  });

  it("leaves an explicit cookie choice alone for crawlers", () => {
    const forwarded = forwardedRequest(
      { "accept-language": "hu-HU", "user-agent": GOOGLEBOT },
      "ja",
    );

    expect(forwarded.headers.get("accept-language")).toBe("hu-HU");
  });
});
