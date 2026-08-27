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
    return new Response(null, { status: 200 });
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
