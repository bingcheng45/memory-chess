import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import type { CacheEntryType, IncrementalCache } from "@opennextjs/aws/types/overrides.js";

const store = withRegionalCache(r2IncrementalCache, { mode: "long-lived" });

/**
 * Pages that never change after the build are copied into static assets at
 * deploy (scripts/cf-static-page-cache.mjs). The edge serves those faster than
 * R2, where one read takes about 400 ms, so they are read there first. Pages
 * that revalidate are not copied and come from R2. The name stays R2's so the
 * deploy still fills the bucket.
 */
const incrementalCache: IncrementalCache = {
  name: store.name,
  async get<CacheType extends CacheEntryType = "cache">(key: string, cacheType?: CacheType) {
    // The cache interceptor asks for a page with no cache type.
    const isPage = (cacheType ?? "cache") === "cache";
    const prerendered = isPage ? await staticAssetsIncrementalCache.get(key, cacheType) : null;
    return prerendered ?? store.get(key, cacheType);
  },
  set: (key, value, cacheType) => store.set(key, value, cacheType),
  delete: (key) => store.delete(key),
};

export default defineCloudflareConfig({
  incrementalCache,
  queue: doQueue,
  // Serves cached pages before the Next server loads, which a cold Worker otherwise spends 200-800 ms of CPU on.
  enableCacheInterception: true,
});
