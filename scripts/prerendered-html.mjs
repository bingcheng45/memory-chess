import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const APP = ".next/server/app";
// Building on Vercel, Next 16 writes prerendered HTML here instead of under APP, as APP_PAGE/<hash>/$/<route>.html.
const ROUTE_CACHE = ".next/server/route-cache/APP_PAGE";

/** Every prerendered page's HTML file, with its route relative to the app root ("en", "en/learn/x"). */
export function prerenderedHtml() {
  const local = existsSync(APP)
    ? readdirSync(APP, { recursive: true })
        .filter((file) => file.endsWith(".html"))
        .map((file) => ({ route: file.slice(0, -".html".length), path: join(APP, file) }))
    : [];
  const vercel = existsSync(ROUTE_CACHE)
    ? readdirSync(ROUTE_CACHE, { recursive: true })
        .filter((file) => file.endsWith(".html") && file.includes("/$/"))
        .map((file) => ({ route: file.slice(file.indexOf("/$/") + 3, -".html".length), path: join(ROUTE_CACHE, file) }))
    : [];
  return [...local, ...vercel];
}
