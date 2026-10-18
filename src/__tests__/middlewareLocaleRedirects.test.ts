/** @jest-environment node */
import { NextRequest } from "next/server";
import middleware from "@/middleware";
import unchangedRedirects from "./__golden__/localeRedirects.main.json";

const ORIGIN = "https://thememorychess.com";

function run(path: string) {
  return middleware(new NextRequest(`${ORIGIN}${path}`, { headers: { "accept-language": "en" } }));
}

function locationOf(path: string) {
  return run(path).headers.get("location")?.replace(ORIGIN, "") ?? null;
}

describe("short language codes", () => {
  it.each([
    ["/pt", "/pt-BR"],
    ["/pt/", "/pt-BR"],
    ["/pt/leaderboard", "/pt-BR/leaderboard"],
    ["/pt/game?a=1&b=2", "/pt-BR/game?a=1&b=2"],
    ["/pt/daily", "/pt-BR/daily"],
    ["/zh", "/zh-CN"],
    ["/zh/", "/zh-CN"],
    ["/zh/game", "/zh-CN/game"],
    ["/zh/dashboard?ref=x", "/zh-CN/dashboard?ref=x"],
    ["/zh/settings", "/zh-CN/game"],
    ["/pt/changelog", "/changelog"],
  ])("permanently redirects %s to %s", (from, to) => {
    const response = run(from);

    expect(response.status).toBe(308);
    expect(locationOf(from)).toBe(to);
  });

  it.each(["/ptolemy", "/zhang/game", "/pt-BR/game", "/zh-CN/game", "/zh-TW/game"])(
    "leaves %s alone",
    (path) => {
      expect(run(path).status).toBe(200);
    },
  );
});

describe("the default language prefix", () => {
  it.each([
    ["/en", "/"],
    ["/en/", "/"],
    ["/en/game", "/game"],
    ["/en/game?a=1&b=2", "/game?a=1&b=2"],
    ["/en/leaderboard", "/leaderboard"],
    ["/en/learn/chess-memory-training", "/learn/chess-memory-training"],
    ["/en/changelog", "/changelog"],
  ])("permanently redirects %s to %s", (from, to) => {
    const response = run(from);

    expect(response.status).toBe(308);
    expect(locationOf(from)).toBe(to);
  });
});

describe("every other language prefix, against main", () => {
  it.each(unchangedRedirects as [string, number, string | null][])("%s answers %i with location %s", (path, status, location) => {
    expect(run(path).status).toBe(status);
    expect(locationOf(path)).toBe(location === null ? null : location);
  });
});
