/**
 * NextRequest needs the Web Fetch globals, which the default jsdom environment does not provide.
 *
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockForwarded: NextRequest[] = [];

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => (request: NextRequest) => {
    mockForwarded.push(request);
    return new Response(null, {
      status: 200,
      headers: { Link: '<https://thememorychess.com/de/privacy>; rel="alternate"; hreflang="de"' },
    });
  },
}));

jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/lib/pages/translatedLocales");

import middleware from "@/middleware";

const run = (url: string) => middleware(new NextRequest(url));

beforeEach(() => {
  mockForwarded.length = 0;
});

describe("middleware on the trust pages, translated into German and not into French", () => {
  it.each(["/de/privacy", "/de/terms", "/de/about"])("serves %s in German, with no hreflang Link header", (path) => {
    const response = run(`https://thememorychess.com${path}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("Link")).toBeNull();
    expect(mockForwarded.map((request) => request.nextUrl.pathname)).toEqual([path]);
  });

  it.each([
    ["https://thememorychess.com/fr/privacy", "https://thememorychess.com/privacy"],
    ["https://thememorychess.com/ja/about/", "https://thememorychess.com/about"],
    ["https://thememorychess.com/en/terms", "https://thememorychess.com/terms"],
  ])("permanently redirects %s to the English URL", (from, to) => {
    const response = run(from);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(to);
  });

  it("answers the bare URL in English whatever the visitor prefers", () => {
    const request = new NextRequest("https://thememorychess.com/privacy", { headers: { "accept-language": "de" } });
    request.cookies.set("NEXT_LOCALE", "de");
    middleware(request);

    expect(mockForwarded[0].headers.get("accept-language")).toBe("en");
    expect(mockForwarded[0].cookies.has("NEXT_LOCALE")).toBe(false);
  });

  it("keeps the changelog and the guides English-only", () => {
    expect(run("https://thememorychess.com/de/changelog").headers.get("location")).toBe("https://thememorychess.com/changelog");
    expect(run("https://thememorychess.com/de/learn").headers.get("location")).toBe("https://thememorychess.com/learn");
  });
});
