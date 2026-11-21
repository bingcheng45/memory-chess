/**
 * PostHog reached through the site's own domain. Ad blockers drop requests to
 * posthog.com, and to paths named after analytics, so the browser SDK posts to
 * /relay and the gateway forwards it. The gateway answers before the
 * middleware runs, so the app Worker never starts for these requests.
 */
export const POSTHOG_RELAY_PATH = "/relay";

const POSTHOG_API_HOST = "us.i.posthog.com";
const POSTHOG_ASSETS_HOST = "us-assets.i.posthog.com";

export function isPostHogRelayPath(pathname: string): boolean {
  return pathname === POSTHOG_RELAY_PATH || pathname.startsWith(`${POSTHOG_RELAY_PATH}/`);
}

/** The PostHog address a /relay request stands for: its scripts come from the assets host, everything else from the API host. */
export function postHogUpstreamUrl(url: URL): URL {
  const path = url.pathname.slice(POSTHOG_RELAY_PATH.length) || "/";
  const host = path.startsWith("/static/") ? POSTHOG_ASSETS_HOST : POSTHOG_API_HOST;
  return new URL(`https://${host}${path}${url.search}`);
}

/**
 * Forwards the request without the site's cookies or the page address, and with the visitor's IP
 * so PostHog places them in the right country instead of in a Cloudflare data
 * centre. Only the SDK's scripts may be kept by a cache: events and their
 * replies are never stored.
 */
export async function relayToPostHog(request: Request): Promise<Response> {
  const upstream = postHogUpstreamUrl(new URL(request.url));
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  // The page address can hold a player name or a search, which events never carry; PostHog does not need it.
  headers.delete("referer");
  headers.set("host", upstream.host);
  const visitorIp = request.headers.get("cf-connecting-ip");
  if (visitorIp) headers.set("x-forwarded-for", visitorIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let answer: Response;
  try {
    answer = await fetch(upstream, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (error) {
    // An analytics request that cannot reach PostHog is dropped; the SDK retries it later.
    console.error("PostHog relay failed", upstream.pathname, error);
    return new Response("Bad Gateway", { status: 502, headers: { "cache-control": "private, no-store" } });
  }

  const response = new Response(answer.body, answer);
  response.headers.delete("set-cookie");
  if (!upstream.pathname.startsWith("/static/")) response.headers.set("cache-control", "private, no-store");
  return response;
}
