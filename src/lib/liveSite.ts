/**
 * True only on the deploy that serves thememorychess.com, so local runs and
 * test deploys never count as visitors. The Cloudflare build and both Workers
 * set SITE_ENV; the layout reads it while prerendering, the middleware per request.
 */
export function isLiveSite(): boolean {
  return process.env.SITE_ENV === "production";
}

/**
 * Set by the Cloudflare gateway on page requests it forwards, after its own run
 * of the middleware has counted any AI crawler, so the app's run does not count
 * the same visit again. The app is reachable only through the gateway.
 */
export const AGENT_COUNTED_HEADER = "x-agent-counted";
