/** Remembers keys for a window in one instance's memory. A full map refuses new keys rather than evicting, so a flood of distinct keys cannot make an old one write twice. */
export function recentKeys({ windowMs, maxKeys }: { windowMs: number; maxKeys: number }) {
  const startedAt = new Map<string, number>();

  const forgetExpired = (now: number) => {
    for (const [key, started] of startedAt) {
      if (now - started < windowMs) return;
      startedAt.delete(key);
    }
  };

  return {
    isNew(key: string, now: number): boolean {
      forgetExpired(now);
      return !startedAt.has(key);
    },
    /** False when the map is full and the key was not remembered. */
    remember(key: string, now: number): boolean {
      forgetExpired(now);
      if (startedAt.has(key)) return true;
      if (startedAt.size >= maxKeys) return false;
      startedAt.set(key, now);
      return true;
    },
    size: () => startedAt.size,
  };
}
