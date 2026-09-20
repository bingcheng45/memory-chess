declare const monotonicBrand: unique symbol;

/**
 * An instant on `performance.now()`'s timeline. `now()` is the only way to make
 * one, so a wall-clock reading cannot reach a remaining or elapsed computation:
 * `Date.now()` moves when the system clock is adjusted, and a round's timing has
 * to survive that.
 */
export type Monotonic = number & { readonly [monotonicBrand]: true };

export function now(): Monotonic {
  return performance.now() as Monotonic;
}

export function deadlineFrom(startedAt: Monotonic, durationMs: number): Monotonic {
  return (startedAt + durationMs) as Monotonic;
}

export function remainingMs(deadline: Monotonic, at: Monotonic): number {
  return Math.max(0, deadline - at);
}

export function elapsedMs(startedAt: Monotonic, at: Monotonic): number {
  return Math.max(0, at - startedAt);
}

/**
 * Returns a frame handler that runs `fire` the first time it is called at or
 * after `deadline`. A backgrounded tab gets no frames, so the handler's first
 * call on return can be far past the deadline; it still fires, and only once.
 */
export function fireAtDeadline(deadline: Monotonic, fire: () => void): (at: Monotonic) => void {
  let fired = false;
  return (at) => {
    if (fired || at < deadline) return;
    fired = true;
    fire();
  };
}

type FrameHandler = (at: Monotonic) => void;

const handlers = new Set<FrameHandler>();
let frame: number | null = null;

function pump(): void {
  if (handlers.size === 0) {
    frame = null;
    return;
  }
  frame = requestAnimationFrame(pump);
  const at = now();
  for (const handler of [...handlers]) handler(at);
}

/**
 * Adds `handler` to the one shared frame loop, which runs only while something
 * is subscribed. Returns the unsubscribe.
 */
export function subscribe(handler: FrameHandler): () => void {
  handlers.add(handler);
  if (frame === null) frame = requestAnimationFrame(pump);

  return () => {
    handlers.delete(handler);
    if (handlers.size > 0 || frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  };
}
