/**
 * NextRequest needs the Web Fetch globals, which the default jsdom environment does not provide.
 *
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { isEnglishOnlyPath, isServedAtBareEnglishUrl, servedLocalesOf } from "@/lib/seo/englishOnly";

const mockForwarded: NextRequest[] = [];

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => (request: NextRequest) => {
    mockForwarded.push(request);
    return new Response(null, { status: 200 });
  },
}));

jest.mock("@/lib/articles/translatedLocales", () => ({
  TRANSLATED_ARTICLE_LOCALES: ["de"],
  ENGLISH_ONLY_ARTICLE_SLUGS: ["adriaan-de-groot"],
}));

import middleware from "@/middleware";

const run = (url: string) => middleware(new NextRequest(url));

beforeEach(() => {
  mockForwarded.length = 0;
});

describe("an article published in English before its translations", () => {
  it("is served in English alone, while the other articles stay translated", () => {
    expect(servedLocalesOf("/articles/adriaan-de-groot")).toEqual(["en"]);
    expect(isEnglishOnlyPath("/articles/adriaan-de-groot")).toBe(true);
    expect(isServedAtBareEnglishUrl("/articles/adriaan-de-groot", "de")).toBe(true);
    expect(servedLocalesOf("/articles/magnus-carlsen")).toEqual(["en", "de"]);
    expect(servedLocalesOf("/articles")).toEqual(["en", "de"]);
  });

  it.each(["/de/articles/adriaan-de-groot", "/de/articles/adriaan-de-groot/", "/fr/articles/adriaan-de-groot"])(
    "redirects %s to the English URL in one hop",
    (path) => {
      const response = run(`https://thememorychess.com${path}`);

      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe("https://thememorychess.com/articles/adriaan-de-groot");
    },
  );

  it("serves the English URL in English", () => {
    const response = run("https://thememorychess.com/articles/adriaan-de-groot");

    expect(response.status).toBe(200);
    expect(mockForwarded.map((request) => request.headers.get("accept-language"))).toEqual(["en"]);
  });

  it("still serves a translated article and the list under the German prefix", () => {
    expect(run("https://thememorychess.com/de/articles/magnus-carlsen").status).toBe(200);
    expect(run("https://thememorychess.com/de/articles").status).toBe(200);
    expect(mockForwarded.map((request) => request.nextUrl.pathname)).toEqual(["/de/articles/magnus-carlsen", "/de/articles"]);
  });
});
