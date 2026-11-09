import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CACHE = ".open-next/cache";
// OpenNext's static assets cache reads entries from here; Cloudflare serves nothing under /cdn-cgi/ to visitors.
const ASSETS_CACHE = ".open-next/assets/cdn-cgi/_next_cache";
const MANIFEST = ".next/prerender-manifest.json";

/**
 * The cache files of pages that never change after the build, given the files
 * under `.open-next/cache` and Next's prerender manifest. A page whose route
 * revalidates, or that the manifest does not list, stays out, so it is read
 * from R2 where its newer copies are written.
 */
export function staticPageCacheFiles(files, manifest) {
  return files.filter((file) => {
    const at = file.indexOf("/$/");
    if (!file.endsWith(".cache") || at === -1) return false;
    const route = manifest.routes[`/${file.slice(at + 3, -".cache".length)}`];
    return route !== undefined && route.initialRevalidateSeconds === false;
  });
}

function copyStaticPageCache() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const files = staticPageCacheFiles(readdirSync(CACHE, { recursive: true }), manifest);
  rmSync(ASSETS_CACHE, { recursive: true, force: true });
  for (const file of files) {
    mkdirSync(dirname(join(ASSETS_CACHE, file)), { recursive: true });
    cpSync(join(CACHE, file), join(ASSETS_CACHE, file));
  }
  console.log(`Copied ${files.length} never-revalidating pages into static assets.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) copyStaticPageCache();
