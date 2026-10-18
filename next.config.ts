import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * The paths src/middleware.ts does not run on, less `_next`, which Next
 * refuses to redirect from config.
 */
const SKIPPED_BY_MIDDLEWARE = "(?:api|_vercel).*|.*\\..*";

const GOOGLE_ADS = ["https://*.googlesyndication.com", "https://*.doubleclick.net", "https://*.adtrafficquality.google", "https://www.google.com"];
const GOOGLE_ANALYTICS = ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://analytics.google.com", "https://*.analytics.google.com"];
const AHREFS = "https://analytics.ahrefs.com";
const DATABUDDY_SCRIPT = "https://cdn.databuddy.cc";
const DATABUDDY_EVENTS = ["https://basket.databuddy.cc", "https://api.databuddy.cc"];
const YOUTUBE = "https://www.youtube.com";

/**
 * 'unsafe-inline' stays in script-src because Next writes per-build inline
 * scripts into statically rendered pages, which hashes cannot follow and a
 * nonce would force to render on every request. img-src admits any https image
 * because Google's tags fetch pixels from country domains such as google.com.sg.
 */
const REPORT_ONLY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${[...GOOGLE_ADS, ...GOOGLE_ANALYTICS, AHREFS, DATABUDDY_SCRIPT, YOUTUBE].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${[...GOOGLE_ADS, ...GOOGLE_ANALYTICS, AHREFS, ...DATABUDDY_EVENTS].join(" ")}`,
  `frame-src ${[...GOOGLE_ADS, YOUTUBE].join(" ")}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  /** Each page's stylesheets ship inside its HTML, so first paint waits on no stylesheet request. */
  experimental: { inlineCss: true },
  /**
   * The middleware strips a trailing slash in the same 308 as its locale and
   * retired-guide redirects, so a URL reaches its canonical form in one hop.
   * Paths it skips lose the slash here, and a slashed `_next` asset path is
   * sent to the not-found page rather than served twice.
   */
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // Vercel serves the production alias without the noindex header it adds to preview hosts.
      {
        source: "/:path*",
        has: [{ type: "host", value: "memory-chess.vercel.app" }],
        destination: "https://thememorychess.com/:path*",
        permanent: true,
      },
      { source: `/:path(${SKIPPED_BY_MIDDLEWARE})/`, destination: "/:path", permanent: true },
    ];
  },
  async rewrites() {
    return { beforeFiles: [{ source: "/_next/:path+/", destination: "/_not-found" }], afterFiles: [], fallback: [] };
  },
  serverExternalPackages: ["google-auth-library"],
  /** The share preview reads its fonts from disk at request time, which tracing cannot see on its own. */
  outputFileTracingIncludes: { "/api/share/**": ["./src/lib/share/fonts/*.ttf", "./src/lib/share/pieces/*.svg"] },
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
