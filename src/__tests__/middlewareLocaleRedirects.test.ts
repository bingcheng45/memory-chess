/** @jest-environment node */
import { NextRequest } from "next/server";
import middleware from "@/middleware";
import unchangedRedirects from "./__golden__/localeRedirects.main.json";

const ORIGIN = "https://thememorychess.com";

function run(path: string, headers: Record<string, string> = { "accept-language": "en" }) {
  return middleware(new NextRequest(`${ORIGIN}${path}`, { headers }));
}

function locationWith(path: string, headers: Record<string, string>) {
  return run(path, headers).headers.get("location")?.replace(ORIGIN, "") ?? null;
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

describe("the language a visitor picked by the prefix they used", () => {
  it("remembers English for a German browser that opens /en/game", () => {
    const response = run("/en/game", { "accept-language": "de" });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/game`);
    expect(response.headers.get("set-cookie")).toBe("NEXT_LOCALE=en; Path=/; SameSite=lax");
  });

  it("replaces a German cookie when /en/game is opened", () => {
    const response = run("/en/game", { "accept-language": "de", cookie: "NEXT_LOCALE=de" });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/game`);
    expect(response.headers.get("set-cookie")).toBe("NEXT_LOCALE=en; Path=/; SameSite=lax");
  });

  it("sets no cookie when English already matches the browser", () => {
    expect(run("/en/game", { "accept-language": "en-US,en;q=0.9" }).headers.get("set-cookie")).toBeNull();
    expect(run("/en/game", { "accept-language": "de", cookie: "NEXT_LOCALE=en" }).headers.get("set-cookie")).toBeNull();
  });

  it("remembers Brazilian Portuguese for a German browser that opens /pt/game", () => {
    const response = run("/pt/game", { "accept-language": "de" });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/pt-BR/game`);
    expect(response.headers.get("set-cookie")).toBe("NEXT_LOCALE=pt-BR; Path=/; SameSite=lax");
  });

  it("remembers Simplified Chinese for an English browser that opens /zh/game", () => {
    const response = run("/zh/game");

    expect(response.headers.get("location")).toBe(`${ORIGIN}/zh-CN/game`);
    expect(response.headers.get("set-cookie")).toBe("NEXT_LOCALE=zh-CN; Path=/; SameSite=lax");
  });
});

describe("a crawler that opens a prefixed URL", () => {
  const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

  it.each([
    ["/en/game", "/game"],
    ["/zh/game", "/zh-CN/game"],
    ["/pt/game", "/pt-BR/game"],
  ])("is redirected from %s to %s without a cookie", (from, to) => {
    const response = run(from, { "user-agent": GOOGLEBOT });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${ORIGIN}${to}`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("/zh picks the Chinese the visitor asked for", () => {
  it.each([
    ["zh-TW,zh;q=0.9,en;q=0.8", "/zh-TW/game"],
    ["en;q=0.9,zh-HK", "/zh-TW/game"],
    ["zh-Hant", "/zh-TW/game"],
    ["zh-Hant-TW", "/zh-TW/game"],
    ["zh-CN,zh-TW;q=0.5", "/zh-CN/game"],
    ["zh;q=0.4,zh-TW;q=0.8", "/zh-TW/game"],
    ["zh-Hans", "/zh-CN/game"],
    ["zh", "/zh-CN/game"],
    ["de", "/zh-CN/game"],
    ["zh-TW;q=0,en", "/zh-CN/game"],
  ])("Accept-Language %s goes to %s", (acceptLanguage, to) => {
    expect(locationWith("/zh/game", { "accept-language": acceptLanguage })).toBe(to);
  });

  it("keeps a visitor's Traditional Chinese cookie ahead of the header", () => {
    const response = run("/zh/game", { "accept-language": "zh-CN", cookie: "NEXT_LOCALE=zh-TW" });

    expect(response.headers.get("location")).toBe(`${ORIGIN}/zh-TW/game`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("follows a zh-TW header to Traditional Chinese and sets no cookie because it already matches", () => {
    const response = run("/zh", { "accept-language": "zh-TW" });

    expect(response.headers.get("location")).toBe(`${ORIGIN}/zh-TW`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("every other language prefix, against main", () => {
  it.each(unchangedRedirects as [string, number, string | null][])("%s answers %i with location %s", (path, status, location) => {
    expect(run(path).status).toBe(status);
    expect(locationOf(path)).toBe(location === null ? null : location);
  });
});

describe("locale prefixes in another letter case", () => {
  it.each([
    ["/zh-cn", "/zh-CN"],
    ["/zh-cn/game?x=1", "/zh-CN/game?x=1"],
    ["/ZH-CN/game", "/zh-CN/game"],
    ["/Zh-Cn/", "/zh-CN"],
    ["/pt-br/leaderboard", "/pt-BR/leaderboard"],
    ["/ZH-TW", "/zh-TW"],
    ["/DE/game", "/de/game"],
    ["/ES/contact-us", "/es/contact-us"],
    ["/EN/game", "/game"],
    ["/ZH/game", "/zh-CN/game"],
    ["/PT", "/pt-BR"],
    ["/ZH-CN/settings", "/zh-CN/game"],
  ])("permanently redirects %s to %s in one hop", (from, to) => {
    expect(run(from).status).toBe(308);
    expect(locationOf(from)).toBe(to);
  });

  it.each(["/zh-CN/game", "/zh-TW/game", "/pt-BR/game", "/de/game"])("leaves %s alone", (path) => {
    expect(run(path).status).toBe(200);
  });
});

describe("the contact page at /contact", () => {
  it.each([
    ["/contact", "/contact-us"],
    ["/contact/", "/contact-us"],
    ["/contact?ref=x", "/contact-us?ref=x"],
    ["/en/contact", "/contact-us"],
    ["/de/contact", "/de/contact-us"],
    ["/zh-CN/contact", "/zh-CN/contact-us"],
    ["/pt-BR/contact", "/pt-BR/contact-us"],
    ["/pt/contact", "/pt-BR/contact-us"],
    ["/ZH-cn/contact", "/zh-CN/contact-us"],
  ])("permanently redirects %s to %s in one hop", (from, to) => {
    expect(run(from).status).toBe(308);
    expect(locationOf(from)).toBe(to);
  });

  it("leaves /contact-us alone", () => {
    expect(run("/contact-us").status).toBe(200);
    expect(run("/de/contact-us").status).toBe(200);
  });
});
