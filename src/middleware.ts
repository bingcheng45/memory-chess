import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * Run on every path except API routes, Next internals, and any request that
   * looks like a static file. `sitemap.xml` and `robots.txt` are excluded
   * explicitly: they are single-origin documents that already enumerate every
   * locale themselves, so a locale redirect on them would be wrong.
   */
  matcher: [
    "/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};
