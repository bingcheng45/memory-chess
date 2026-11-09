import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CACHE = ".open-next/cache";
// OpenNext's static assets cache reads entries from here; Cloudflare serves nothing under /cdn-cgi/ to visitors.
const ASSETS_CACHE = ".open-next/assets/cdn-cgi/_next_cache";
// The gateway reads these through its binding to the app and refuses them to visitors (src/lib/cloudflare/gatewayPages.ts).
const GATEWAY_DIR = ".open-next/assets/_gateway";
const MANIFEST = ".next/prerender-manifest.json";
const ROUTES_MANIFEST = ".next/routes-manifest.json";

/** What OpenNext's cache interceptor sends with a stored page that never revalidates. */
const STORED_PAGE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "s-maxage=31536000, stale-while-revalidate=2592000",
  vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, x-prerender-revalidate",
  "x-opennext-cache": "HIT",
};

/** The route a cache file stores, such as "/de/about" for ".../$/de/about.cache", or null. */
export function routeOf(file) {
  const at = file.indexOf("/$/");
  if (!file.endsWith(".cache") || at === -1) return null;
  return `/${file.slice(at + 3, -".cache".length)}`;
}

/**
 * The cache files of pages that never change after the build, given the files
 * under `.open-next/cache` and Next's prerender manifest. A page whose route
 * revalidates, or that the manifest does not list, stays out, so it is read
 * from R2 where its newer copies are written.
 */
export function staticPageCacheFiles(files, manifest) {
  return files.filter((file) => {
    const route = routeOf(file);
    const entry = route === null ? undefined : manifest.routes[route];
    return entry !== undefined && entry.initialRevalidateSeconds === false;
  });
}

/** The HTML and page headers the gateway may serve for a cache entry, or null for anything but a plain 200 page. */
export function gatewayPage(route, entry) {
  if (route.startsWith("/_") || entry.type !== "app" || typeof entry.html !== "string") return null;
  const meta = entry.meta ?? {};
  if (meta.postponed !== undefined || (meta.status !== undefined && meta.status !== 200)) return null;
  const headers = Object.fromEntries(Object.entries(meta.headers ?? {}).filter(([name]) => name !== "x-next-cache-tags"));
  return { html: entry.html, headers };
}

/** The headers next.config.ts sends with every path, from Next's routes manifest. */
export function headersForEveryPath(routesManifest) {
  return Object.fromEntries(
    routesManifest.headers
      .filter((rule) => rule.source === "/:path*")
      .flatMap((rule) => rule.headers.map(({ key, value }) => [key.toLowerCase(), value])),
  );
}

function copyStaticPageCache() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const routesManifest = JSON.parse(readFileSync(ROUTES_MANIFEST, "utf8"));
  const files = staticPageCacheFiles(readdirSync(CACHE, { recursive: true }), manifest);
  rmSync(ASSETS_CACHE, { recursive: true, force: true });
  rmSync(GATEWAY_DIR, { recursive: true, force: true });

  const pages = {};
  for (const file of files) {
    mkdirSync(dirname(join(ASSETS_CACHE, file)), { recursive: true });
    cpSync(join(CACHE, file), join(ASSETS_CACHE, file));

    const route = routeOf(file);
    const page = gatewayPage(route, JSON.parse(readFileSync(join(CACHE, file), "utf8")));
    if (!page) continue;
    const target = join(GATEWAY_DIR, "pages", `${route}.page`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, page.html);
    pages[route] = page.headers;
  }

  const headers = { ...STORED_PAGE_HEADERS, ...headersForEveryPath(routesManifest) };
  writeFileSync(join(GATEWAY_DIR, "pages.json"), JSON.stringify({ headers, pages }));
  console.log(`Copied ${files.length} never-revalidating pages into static assets, ${Object.keys(pages).length} of them for the gateway.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) copyStaticPageCache();
