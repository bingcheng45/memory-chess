import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PAGES_MANIFEST = ".open-next/assets/_gateway/pages.json";
const SITE_ORIGIN = "https://thememorychess.com";
const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
/** Set per response or per hop by Cloudflare, or the gateway's own marker. */
const IGNORED = new Set([
  "date", "server", "cf-ray", "cf-cache-status", "alt-svc", "nel", "report-to", "connection", "transfer-encoding",
  "content-length", "age", "speculation-rules", "x-gateway-cache",
  // OpenNext leaks the middleware's internal copy of Set-Cookie; the gateway sends only the real one.
  "x-middleware-set-cookie",
]);
/** Asked straight, the app answers a bare page that depends on the visitor as unstorable, so its Vary skips the regeneration header. */
const NEGOTIATED_ONLY = new Set(["vary"]);
const UNSTORABLE = "private, no-store";
/** The gateway replaces the app's cache-control on every page with what Vercel sends (src/lib/cloudflare/gateway.ts). */
const VISITOR_CACHE_CONTROL = "public, max-age=0, must-revalidate";

/** The public URL path of a page the app renders at `route`: English pages have no prefix. */
export function publicPath(route) {
  if (route === "/en") return "/";
  return route.startsWith("/en/") ? route.slice(3) : route;
}

/**
 * The differences between the gateway's answer and the app's, given each as
 * `{ status, headers, bodyHash }` with lower-case header names.
 */
export function differences(gateway, app, appOrigin) {
  const found = [];
  if (gateway.status !== app.status) found.push(`status ${gateway.status} vs ${app.status}`);
  if (gateway.bodyHash !== app.bodyHash) found.push("body differs");
  const negotiated = app.headers["cache-control"] === UNSTORABLE;
  const names = new Set([...Object.keys(gateway.headers), ...Object.keys(app.headers)]);
  for (const name of [...names].sort()) {
    if (IGNORED.has(name) || name === "cache-control" || (negotiated && NEGOTIATED_ONLY.has(name))) continue;
    const ours = gateway.headers[name];
    const theirs = name === "link" ? app.headers[name]?.replaceAll(`<${appOrigin}`, `<${SITE_ORIGIN}`) : app.headers[name];
    if (ours !== theirs) found.push(`${name}: gateway ${JSON.stringify(ours)} vs app ${JSON.stringify(theirs)}`);
  }
  if (gateway.status === 200 && gateway.headers["cache-control"] !== VISITOR_CACHE_CONTROL) {
    found.push(`cache-control: gateway ${JSON.stringify(gateway.headers["cache-control"])}, expected ${JSON.stringify(VISITOR_CACHE_CONTROL)}`);
  }
  // A prefixed English-only page redirects to its bare URL, which only the app answers.
  if (app.status === 200 && gateway.headers["x-gateway-cache"] !== "HIT") found.push("not served by the gateway");
  return found;
}

async function snapshot(url) {
  const response = await fetch(url, { redirect: "manual", headers: { "user-agent": BROWSER, "accept-language": "en-US,en;q=0.9" } });
  const body = Buffer.from(await response.arrayBuffer());
  const headers = {};
  for (const [name, value] of response.headers) headers[name] = name === "set-cookie" ? response.headers.getSetCookie().join("\n") : value;
  return { status: response.status, headers, bodyHash: createHash("sha256").update(body).digest("hex") };
}

async function main() {
  const [gatewayOrigin, appOrigin] = process.argv.slice(2);
  if (!gatewayOrigin || !appOrigin) {
    console.error("usage: node scripts/cf-gateway-parity.mjs <gateway origin> <app origin>");
    process.exit(2);
  }
  const routes = Object.keys(JSON.parse(readFileSync(PAGES_MANIFEST, "utf8")).pages);
  const failures = [];
  let next = 0;
  async function worker() {
    while (next < routes.length) {
      const path = publicPath(routes[next++]);
      const [gateway, app] = await Promise.all([snapshot(gatewayOrigin + path), snapshot(appOrigin + path)]);
      const found = differences(gateway, app, appOrigin);
      if (found.length > 0) failures.push({ path, found });
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  for (const { path, found } of failures.sort((a, b) => a.path.localeCompare(b.path))) console.log(`${path}\n  ${found.join("\n  ")}`);
  console.log(`${routes.length} pages compared, ${routes.length - failures.length} identical, ${failures.length} different.`);
  process.exit(failures.length === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
