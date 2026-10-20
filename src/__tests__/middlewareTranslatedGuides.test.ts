/** @jest-environment node */
import { NextRequest } from "next/server";

const mockForwarded: NextRequest[] = [];

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => (request: NextRequest) => {
    mockForwarded.push(request);
    return new Response(null, {
      status: 200,
      headers: { Link: '<https://thememorychess.com/it/learn/x>; rel="alternate"; hreflang="it"' },
    });
  },
}));

import middleware from "@/middleware";

const run = (path: string) => middleware(new NextRequest(`https://thememorychess.com${path}`));

beforeEach(() => {
  mockForwarded.length = 0;
});

describe("middleware on the translated Learn guides", () => {
  it.each([
    "/de/learn/blindfold-chess-training-for-beginners",
    "/ru/learn/how-to-see-the-whole-board-in-chess",
    "/pt-BR/learn/chess-visualization-exercises",
    "/fr/learn/how-to-stop-blundering-in-chess",
    "/es/learn/how-to-get-better-at-chess-for-beginners",
  ])("serves %s in its language with no redirect and no hreflang header", (path) => {
    const response = run(path);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("Link")).toBeNull();
    expect(mockForwarded.map((request) => request.nextUrl.pathname)).toEqual([path]);
  });

  it.each([
    ["/it/learn/blindfold-chess-training-for-beginners", "https://thememorychess.com/learn/blindfold-chess-training-for-beginners"],
    ["/de/learn/chess-memory-training", "https://thememorychess.com/learn/chess-memory-training"],
    ["/de/learn", "https://thememorychess.com/learn"],
    ["/de/learn/search", "https://thememorychess.com/learn/search"],
    ["/en/learn/blindfold-chess-training-for-beginners", "https://thememorychess.com/learn/blindfold-chess-training-for-beginners"],
  ])("permanently redirects %s to %s", (from, to) => {
    const response = run(from);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(to);
  });

  it("answers the bare English guide in English whatever the visitor prefers", () => {
    const request = new NextRequest("https://thememorychess.com/learn/blindfold-chess-training-for-beginners", {
      headers: { "accept-language": "de" },
    });
    request.cookies.set("NEXT_LOCALE", "de");
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(mockForwarded[0].headers.get("accept-language")).toBe("en");
    expect(mockForwarded[0].cookies.has("NEXT_LOCALE")).toBe(false);
  });
});

describe("middleware on a retired guide whose replacement is translated", () => {
  it("keeps the reader's locale when the replacement is served in it, and goes to English when it is not", () => {
    expect(run("/de/learn/chess-board-vision-drills").headers.get("location")).toBe(
      "https://thememorychess.com/de/learn/how-to-see-the-whole-board-in-chess",
    );
    expect(run("/it/learn/chess-board-vision-drills").headers.get("location")).toBe(
      "https://thememorychess.com/learn/how-to-see-the-whole-board-in-chess",
    );
  });
});
