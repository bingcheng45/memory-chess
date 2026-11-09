import type { AppBinding } from "./gateway";

/** Written into the app's static assets at deploy by scripts/cf-static-page-cache.mjs. */
export interface PageManifest {
  /** Sent with every stored page. */
  headers: Record<string, string>;
  /** The pages the gateway may serve, by the path the app renders (`/en/about`), with their own headers. */
  pages: Record<string, Record<string, string>>;
}

const FILES_PREFIX = "/_gateway/";
const FILES_ORIGIN = "https://gateway-pages.local";
/** A manifest is reused this long, so a deploy that drops a page is seen within a minute. */
const MANIFEST_TTL_MS = 60_000;
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

// Holds the loaded manifest, never the pending fetch: a promise started by one request must not be awaited by another.
const manifests = new WeakMap<AppBinding, { loadedAt: number; manifest: PageManifest | null }>();

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

async function loadManifest(files: AppBinding): Promise<PageManifest | null> {
  try {
    const response = await files.fetch(new Request(`${FILES_ORIGIN}${FILES_PREFIX}pages.json`));
    return response.ok ? ((await response.json()) as PageManifest) : null;
  } catch {
    return null;
  }
}

async function manifestFrom(files: AppBinding): Promise<PageManifest | null> {
  const cached = manifests.get(files);
  if (cached && Date.now() - cached.loadedAt < MANIFEST_TTL_MS) return cached.manifest;
  const manifest = await loadManifest(files);
  manifests.set(files, { loadedAt: Date.now(), manifest });
  return manifest;
}

/**
 * The stored HTML of a page that never changes after the build, read from the
 * app's static assets without starting the app, or null when the page is not
 * stored. The app answers anything else.
 */
export async function storedPage(path: string, files: AppBinding): Promise<Response | null> {
  const manifest = await manifestFrom(files);
  const pageHeaders = manifest?.pages[path];
  if (!manifest || !pageHeaders) return null;

  const file = await files.fetch(new Request(`${FILES_ORIGIN}${FILES_PREFIX}pages${path}.page`));
  if (!file.ok) {
    await file.body?.cancel();
    return null;
  }
  const headers = new Headers({ ...manifest.headers, ...pageHeaders });
  headers.set("x-gateway-cache", "HIT");
  return new Response(file.body, { status: 200, headers });
}
