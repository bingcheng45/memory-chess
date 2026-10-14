import { useEffect, useState } from "react";
import { COUNTDOWN_MS } from "@/lib/round/round";

const SECOND_MS = 1000;

/**
 * The whole seconds left before `endsAt`, 3 then 2 then 1, and `onEnd` once it passes. Each tick waits for the next
 * second boundary rather than an interval, so a late timer never shows a number for less than its second.
 */
export function useCountdown(endsAt: number | null, onEnd: (now: number) => void): number | null {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (endsAt === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const at = performance.now();
      if (at >= endsAt) {
        onEnd(at);
        return;
      }
      setNow(at);
      timer = setTimeout(tick, (endsAt - at) % SECOND_MS || SECOND_MS);
    };
    tick();
    return () => clearTimeout(timer);
  }, [endsAt, onEnd]);

  if (endsAt === null) return null;
  return Math.min(COUNTDOWN_MS / SECOND_MS, Math.max(1, Math.ceil((endsAt - now) / SECOND_MS)));
}
