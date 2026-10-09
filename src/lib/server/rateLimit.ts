export type RateVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

interface Bucket {
  readonly startedAt: number;
  readonly count: number;
}

/**
 * Counts calls per key in fixed windows, in this server instance's memory only. Each serverless instance keeps its own
 * counts and loses them on a cold start, so this caps a burst from one caller rather than enforcing an exact quota.
 */
export function fixedWindowLimiter({ limit, windowMs, maxKeys }: { limit: number; windowMs: number; maxKeys: number }) {
  const windows = new Map<string, Bucket>();

  return (key: string, now: number): RateVerdict => {
    const current = windows.get(key);
    if (current && now - current.startedAt < windowMs) {
      if (current.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((current.startedAt + windowMs - now) / 1000) };
      }
      windows.set(key, { ...current, count: current.count + 1 });
      return { allowed: true };
    }
    windows.delete(key);
    if (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    windows.set(key, { startedAt: now, count: 1 });
    return { allowed: true };
  };
}

/** Vercel puts the caller first in x-forwarded-for. Without either header every caller shares one bucket. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
