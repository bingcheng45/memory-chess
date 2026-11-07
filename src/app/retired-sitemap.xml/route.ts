import { retiredSitemapXml } from "@/lib/seo/retiredUrls";

/** Built once: the list comes from code, not from data. */
export const dynamic = "force-static";

export function GET() {
  return new Response(retiredSitemapXml(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
