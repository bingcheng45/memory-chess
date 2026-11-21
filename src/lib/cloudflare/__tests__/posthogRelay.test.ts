/**
 * @jest-environment node
 */
import { handleGatewayRequest } from "../gateway";
import { isPostHogRelayPath, postHogUpstreamUrl } from "../posthogRelay";

jest.mock("@/lib/articles/translatedLocales");

const site = (path: string) => new URL(`https://thememorychess.com${path}`);

describe("PostHog relay", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  test("claims /relay and its subpaths only", () => {
    expect(isPostHogRelayPath("/relay")).toBe(true);
    expect(isPostHogRelayPath("/relay/e/")).toBe(true);
    expect(isPostHogRelayPath("/relayed")).toBe(false);
    expect(isPostHogRelayPath("/en/relay")).toBe(false);
  });

  test("sends scripts to the assets host and everything else to the API host, keeping the query", () => {
    expect(postHogUpstreamUrl(site("/relay/static/array.js?v=1")).href).toBe("https://us-assets.i.posthog.com/static/array.js?v=1");
    expect(postHogUpstreamUrl(site("/relay/e/?ip=0&ver=1")).href).toBe("https://us.i.posthog.com/e/?ip=0&ver=1");
    expect(postHogUpstreamUrl(site("/relay/array/phc_x/config")).href).toBe("https://us.i.posthog.com/array/phc_x/config");
    expect(postHogUpstreamUrl(site("/relay//evil.example/x")).host).toBe("us.i.posthog.com");
  });

  test("answers before the middleware and the app, without the site's cookies, with the visitor's IP", async () => {
    const forwarded: Request[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      forwarded.push(new Request(input, init));
      return new Response("ok", { headers: { "set-cookie": "ph=1", "cache-control": "public, max-age=60" } });
    }) as typeof fetch;
    const app = { fetch: jest.fn() };

    const response = await handleGatewayRequest(
      new Request("https://thememorychess.com/relay/e/?ver=1", {
        method: "POST",
        body: '{"event":"round_start"}',
        headers: { cookie: "NEXT_LOCALE=de", "cf-connecting-ip": "203.0.113.7" },
      }),
      { app, englishApp: app },
      { waitUntil: () => undefined },
    );

    expect(app.fetch).not.toHaveBeenCalled();
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0].url).toBe("https://us.i.posthog.com/e/?ver=1");
    expect(forwarded[0].method).toBe("POST");
    expect(await forwarded[0].text()).toBe('{"event":"round_start"}');
    expect(forwarded[0].headers.get("cookie")).toBeNull();
    expect(forwarded[0].headers.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  test("lets a cache keep the SDK's scripts", async () => {
    global.fetch = jest.fn(async () => new Response("js", { headers: { "cache-control": "public, max-age=3600" } })) as typeof fetch;
    const app = { fetch: jest.fn() };
    const response = await handleGatewayRequest(new Request("https://thememorychess.com/relay/static/array.js"), { app, englishApp: app }, { waitUntil: () => undefined });
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  test("passes a compressed body on byte for byte", async () => {
    const forwarded: Request[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      forwarded.push(new Request(input, init));
      return new Response("ok");
    }) as typeof fetch;
    const gzip = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff, 0x00, 0x7f]);
    const app = { fetch: jest.fn() };
    await handleGatewayRequest(new Request("https://thememorychess.com/relay/e/?compression=gzip-js", { method: "POST", body: gzip }), { app, englishApp: app }, { waitUntil: () => undefined });

    expect(forwarded[0].url).toBe("https://us.i.posthog.com/e/?compression=gzip-js");
    expect(new Uint8Array(await forwarded[0].arrayBuffer())).toEqual(gzip);
  });

  test("answers 502 without throwing when PostHog cannot be reached", async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError("network down");
    }) as typeof fetch;
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const app = { fetch: jest.fn() };
    const response = await handleGatewayRequest(new Request("https://thememorychess.com/relay/e/"), { app, englishApp: app }, { waitUntil: () => undefined });
    error.mockRestore();

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
