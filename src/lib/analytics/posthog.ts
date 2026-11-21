/**
 * The site's link to PostHog. The SDK loads after the page does (SitePostHog), so events sent before it arrives
 * wait here and replay once it attaches. Only the live site attaches one, so elsewhere the queue just stays small.
 */
export type PostHogProperties = Record<string, unknown>;

export interface PostHogClient {
  capture(event: string, properties?: PostHogProperties, options?: { timestamp?: Date }): unknown;
  register(properties: PostHogProperties): void;
}

type Pending = { kind: "capture"; event: string; properties: PostHogProperties; timestamp: Date } | { kind: "register"; properties: PostHogProperties };

/** Enough for everything a page sends before its load event; more would only grow on a page with no SDK. */
const MAX_PENDING = 50;

let client: PostHogClient | null = null;
const pending: Pending[] = [];

function send(call: Pending, to: PostHogClient): void {
  if (call.kind === "capture") to.capture(call.event, call.properties, { timestamp: call.timestamp });
  else to.register(call.properties);
}

function enqueue(call: Pending): void {
  if (client) send(call, client);
  else if (pending.length < MAX_PENDING) pending.push(call);
}

export function capturePostHog(event: string, properties: PostHogProperties): void {
  enqueue({ kind: "capture", event, properties, timestamp: new Date() });
}

/** Properties PostHog adds to every later event in this browser, without building a person profile. */
export function registerPostHog(properties: PostHogProperties): void {
  enqueue({ kind: "register", properties });
}

export function attachPostHog(loaded: PostHogClient): void {
  client = loaded;
  for (const call of pending.splice(0)) send(call, loaded);
}

/** For tests: forget the client and anything queued. */
export function resetPostHogForTests(): void {
  client = null;
  pending.length = 0;
}
