export type RateVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

interface Bucket {
  readonly startedAt: number;
  readonly count: number;
}

/** Counts live in one serverless instance's memory and reset on a cold start, so this caps bursts, not an exact quota. */
export function fixedWindowLimiter({ limit, windowMs, maxKeys }: { limit: number; windowMs: number; maxKeys: number }) {
  // Expired windows are swept before a key is read, so every new window is appended and the map stays in start order.
  const windows = new Map<string, Bucket>();

  const forgetExpired = (now: number) => {
    for (const [key, bucket] of windows) {
      if (now - bucket.startedAt < windowMs) return;
      windows.delete(key);
    }
  };

  const check = (key: string, now: number): RateVerdict => {
    forgetExpired(now);
    const current = windows.get(key);
    if (current) {
      if (current.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((current.startedAt + windowMs - now) / 1000) };
      }
      windows.set(key, { ...current, count: current.count + 1 });
      return { allowed: true };
    }
    if (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    windows.set(key, { startedAt: now, count: 1 });
    return { allowed: true };
  };

  return Object.assign(check, { size: () => windows.size });
}

/**
 * Cloudflare sets cf-connecting-ip to the caller, but keeps a client's own x-forwarded-for and appends to it,
 * so that header's first entry is whatever the caller wrote. The fallbacks only serve tests and local runs.
 */
export function clientAddress(headers: Headers): string {
  const connecting = headers.get("cf-connecting-ip")?.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return connecting || forwarded || headers.get("x-real-ip") || "unknown";
}
