/**
 * @jest-environment node
 */
import { handleGatewayRequest } from "../gateway";

jest.mock("@/lib/articles/translatedLocales");

const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function recordingApp(name: string, calls: { via: string; request: Request }[]) {
  return {
    fetch: async (request: Request) => {
      calls.push({ via: name, request });
      return new Response("page", { headers: { "cache-control": "s-maxage=31536000" } });
    },
  };
}

async function visit(path: string, headers: Record<string, string>) {
  const calls: { via: string; request: Request }[] = [];
  const response = await handleGatewayRequest(
    new Request(`https://cf-test.thememorychess.com${path}`, { headers: { "user-agent": BROWSER, ...headers } }),
    { app: recordingApp("app", calls), englishApp: recordingApp("englishApp", calls) },
    { waitUntil: () => undefined },
  );
  return { response, calls };
}

describe("Cloudflare gateway", () => {
  test("sends an English visitor's home page to the cacheable English app with the locale fixed", async () => {
    const { calls } = await visit("/", { "accept-language": "en-US,en;q=0.9", cookie: "_ga=1" });
    expect(calls.map((call) => call.via)).toEqual(["englishApp"]);
    expect(calls[0].request.headers.get("cookie")).toBe("NEXT_LOCALE=en");
    expect(calls[0].request.headers.get("accept-language")).toBe("en");
  });

  test("adds back the locale cookie the middleware sets for a visitor whose browser names no language", async () => {
    const { response } = await visit("/game", {});
    expect(response.headers.get("set-cookie")).toContain("NEXT_LOCALE=en");
  });

  test("leaves a German visitor's home page to the app, which redirects to /de", async () => {
    const { calls } = await visit("/", { "accept-language": "de-DE,de;q=0.9" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(calls[0].request.headers.get("accept-language")).toBe("de-DE,de;q=0.9");
  });

  test("respects a saved locale choice over an English browser", async () => {
    const { calls } = await visit("/leaderboard", { "accept-language": "en-US", cookie: "NEXT_LOCALE=fr" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
  });

  test("uses the country hint when the browser language is not one the site ships", async () => {
    const { calls } = await visit("/", { "accept-language": "xx", "cf-ipcountry": "BR" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
  });

  test("serves Googlebot the English page whatever language it sends", async () => {
    const { calls } = await visit("/", { "user-agent": GOOGLEBOT, "accept-language": "hu" });
    expect(calls.map((call) => call.via)).toEqual(["englishApp"]);
  });

  test("records the language of an opened /de link for a visitor whose saved choice was French", async () => {
    const { response, calls } = await visit("/de/game", { "accept-language": "en-US", cookie: "NEXT_LOCALE=fr" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(response.headers.get("set-cookie")).toContain("NEXT_LOCALE=de");
  });

  test.each(["/learn", "/de", "/api/game-stats", "/favicon.ico"])("passes %s straight to the app", async (path) => {
    const { calls } = await visit(path, { "accept-language": "de" });
    expect(calls.map((call) => call.via)).toEqual(["app"]);
    expect(calls[0].request.headers.get("accept-language")).toBe("de");
  });
});
