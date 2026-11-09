import handler from "../.open-next/worker.js";
import { withWorkersCachePolicy } from "../src/lib/cloudflare/workersCache";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

const worker = {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    return withWorkersCachePolicy(response, new URL(request.url).pathname);
  },
};

export default worker;
