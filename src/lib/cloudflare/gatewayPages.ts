import type { AppBinding } from "./gateway";

/** Written by scripts/cf-static-page-cache.mjs at deploy and bundled into the gateway, so reading it costs nothing. */
export interface PageManifest {
  /** Changes whenever any stored page does, so a deploy never answers from an older deploy's cached copy. */
  version: string;
  /** Sent with every stored page. */
  headers: Record<string, string>;
  /** The pages the gateway may serve, by the path the app renders (`/en/about`), with their own headers. */
  pages: Record<string, Record<string, string>>;
}

/** The parts of the Workers Cache API the gateway uses; it keeps a copy on the Cloudflare machine that served it. */
export interface PageCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface PageStore {
  manifest: PageManifest;
  /** The app's static assets, which hold the HTML. */
  files: AppBinding;
  cache?: PageCache;
}

const FILES_PREFIX = "/_gateway/";
const FILES_ORIGIN = "https://gateway-pages.local";
/** The cached copy is keyed by the manifest version, so it can live as long as the machine keeps it. */
const CACHED_COPY_CONTROL = "public, max-age=31536000, immutable";
/** Requests from the Next router, regeneration and server actions want something other than the stored HTML. */
const APP_ONLY_HEADERS = [
  "rsc",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-router-state-tree",
  "next-url",
  "next-action",
  "x-prerender-revalidate",
];

/** The gateway's own files sit among the app's static assets, which must not be reachable from outside. */
export function isGatewayFile(pathname: string): boolean {
  return pathname.startsWith(FILES_PREFIX);
}

/** A plain page load, which the stored HTML answers exactly as the app would. */
export function wantsStoredHtml(request: Request): boolean {
  if (request.method !== "GET") return false;
  if (APP_ONLY_HEADERS.some((name) => request.headers.has(name))) return false;
  return !new URL(request.url).searchParams.has("_rsc");
}

/** The path the app would render for this middleware answer, or null when it redirects or fails. */
export function renderedPath(request: Request, decision: Response): string | null {
  if (decision.status !== 200 || decision.headers.has("location")) return null;
  const rewrite = decision.headers.get("x-middleware-rewrite");
  return new URL(rewrite ?? request.url).pathname;
}

/** The page's HTML, from this machine's cache when it has it, else from the static assets, which then fill the cache. */
async function pageBody(
  path: string,
  store: PageStore,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<ReadableStream | null> {
  const file = `${FILES_PREFIX}pages${path}.page`;
  const key = new Request(`${FILES_ORIGIN}/${store.manifest.version}${file}`);
  const cached = await store.cache?.match(key);
  if (cached?.body) return cached.body;

  const fetched = await store.files.fetch(new Request(`${FILES_ORIGIN}${file}`));
  if (!fetched.ok || !fetched.body) {
    await fetched.body?.cancel();
    return null;
  }
  if (!store.cache) return fetched.body;
  const [visitor, copy] = fetched.body.tee();
  waitUntil(store.cache.put(key, new Response(copy, { headers: { "cache-control": CACHED_COPY_CONTROL } })));
  return visitor;
}

/**
 * The stored HTML of a page that never changes after the build, without
 * starting the app, or null when the page is not stored. The app answers
 * anything else.
 */
export async function storedPage(
  path: string,
  store: PageStore,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response | null> {
  const pageHeaders = store.manifest.pages[path];
  if (!pageHeaders) return null;
  const body = await pageBody(path, store, waitUntil);
  if (body === null) return null;
  const headers = new Headers({ ...store.manifest.headers, ...pageHeaders });
  headers.set("x-gateway-cache", "HIT");
  return new Response(body, { status: 200, headers });
}
