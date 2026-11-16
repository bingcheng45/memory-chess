import { handleGatewayRequest, type AppBinding } from "../../src/lib/cloudflare/gateway";
import type { PageManifest } from "../../src/lib/cloudflare/gatewayPages";
// Written by scripts/cf-static-page-cache.mjs, which `npm run cf:deploy` runs before deploying this Worker.
import manifest from "./pages.json";

interface Env {
  APP: AppBinding;
  APP_LOCALE_DECIDED: AppBinding;
}

const gateway = {
  fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    const pages = { manifest: manifest as PageManifest, files: env.APP, cache: caches.default };
    return handleGatewayRequest(request, { app: env.APP, englishApp: env.APP_LOCALE_DECIDED, pages }, ctx);
  },
};

export default gateway;
