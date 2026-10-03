const CHARS_PER_SECOND = 150;
const PAUSE_AFTER_MS = { heading: 140, paragraph: 280 } as const;
const MAX_FRAME_MS = 64;
const VIEWPORT_MARGIN_PX = 48;

const MS_PER_SECOND = 1000;

export type BlockKind = keyof typeof PAUSE_AFTER_MS;
export type BlockPlacement = "above" | "inside" | "below";
export type BlockProgress = { readonly chars: number; readonly carry: number; readonly restMs: number };
export const BLOCK_START: BlockProgress = { chars: 0, carry: 0, restMs: 0 };

export function placementOf(rect: { top: number; bottom: number }, viewportHeight: number): BlockPlacement {
  if (rect.bottom < 0) return "above";
  if (rect.top > viewportHeight - VIEWPORT_MARGIN_PX) return "below";
  return "inside";
}

export function advance(
  progress: BlockProgress,
  block: { length: number; kind: BlockKind },
  elapsedMs: number,
  placement: BlockPlacement,
): BlockProgress {
  const frameMs = Math.min(elapsedMs, MAX_FRAME_MS);

  if (placement === "above") return { chars: block.length, carry: 0, restMs: 0 };
  if (progress.chars >= block.length) return { ...progress, restMs: Math.max(0, progress.restMs - frameMs) };
  if (progress.chars === 0 && placement === "below") return progress;

  const typed = progress.carry + (frameMs * CHARS_PER_SECOND) / MS_PER_SECOND;
  const whole = Math.floor(typed);
  const chars = progress.chars + whole;

  if (chars >= block.length) return { chars: block.length, carry: 0, restMs: PAUSE_AFTER_MS[block.kind] };
  return { chars, carry: typed - whole, restMs: 0 };
}

export function isFinished(progress: BlockProgress, length: number): boolean {
  return progress.chars >= length && progress.restMs <= 0;
}
