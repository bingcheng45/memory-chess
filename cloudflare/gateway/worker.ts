import { handleGatewayRequest, type AppBinding } from "../../src/lib/cloudflare/gateway";

interface Env {
  APP: AppBinding;
  APP_LOCALE_DECIDED: AppBinding;
}

const gateway = {
  fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
    return handleGatewayRequest(request, { app: env.APP, englishApp: env.APP_LOCALE_DECIDED }, ctx);
  },
};

export default gateway;
