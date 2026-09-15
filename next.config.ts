import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * The paths src/middleware.ts does not run on, less `_next`, which Next
 * refuses to redirect from config.
 */
const SKIPPED_BY_MIDDLEWARE = "(?:api|_vercel).*|.*\\..*";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  /**
   * The middleware strips a trailing slash in the same 308 as its locale and
   * retired-guide redirects, so a URL reaches its canonical form in one hop.
   * Paths it skips lose the slash here, and a slashed `_next` asset path is
   * sent to the not-found page rather than served twice.
   */
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [{ source: `/:path(${SKIPPED_BY_MIDDLEWARE})/`, destination: "/:path", permanent: true }];
  },
  async rewrites() {
    return { beforeFiles: [{ source: "/_next/:path+/", destination: "/_not-found" }], afterFiles: [], fallback: [] };
  },
  serverExternalPackages: ["google-auth-library"],
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
