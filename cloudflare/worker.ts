import handler from "../.open-next/worker.js";
import { withWorkersCachePolicy } from "../src/lib/cloudflare/workersCache";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

interface Context {
  props?: { localeDecided?: boolean };
}

const worker = {
  async fetch(request: Request, env: unknown, ctx: Context): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    return withWorkersCachePolicy(response, request, ctx.props?.localeDecided === true);
  },
};

export default worker;
