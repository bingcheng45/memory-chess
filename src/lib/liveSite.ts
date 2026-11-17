/**
 * True only on the deploy that serves thememorychess.com, so local runs and
 * test deploys never count as visitors. The Cloudflare build and both Workers
 * set SITE_ENV; the layout reads it while prerendering, the middleware per request.
 */
export function isLiveSite(): boolean {
  return process.env.SITE_ENV === "production";
}
