import type { ArticleSection } from "@/lib/articles/schema";

export const DEFAULT_CHARS_PER_SECOND = 150;
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
  block: { length: number; kind: BlockKind; charsPerSecond: number },
  elapsedMs: number,
  placement: BlockPlacement,
): BlockProgress {
  const frameMs = Math.min(elapsedMs, MAX_FRAME_MS);

  if (placement === "above") return { chars: block.length, carry: 0, restMs: 0 };
  if (progress.chars >= block.length) return { ...progress, restMs: Math.max(0, progress.restMs - frameMs) };
  if (progress.chars === 0 && placement === "below") return progress;

  const typed = progress.carry + (frameMs * block.charsPerSecond) / MS_PER_SECOND;
  const whole = Math.floor(typed);
  const chars = progress.chars + whole;

  if (chars >= block.length) return { chars: block.length, carry: 0, restMs: PAUSE_AFTER_MS[block.kind] };
  return { chars, carry: typed - whole, restMs: 0 };
}

const COMBINING_MARK = /^\p{M}$/u;
const LETTER = /^\p{L}$/u;
const ZERO_WIDTH_JOINER = String.fromCharCode(0x200d);
const DEVANAGARI_VIRAMA = String.fromCharCode(0x94d);

function staysWithNext(codePoint: string, next: string): boolean {
  if (COMBINING_MARK.test(next)) return true;
  if (codePoint === ZERO_WIDTH_JOINER || next === ZERO_WIDTH_JOINER) return true;
  return codePoint === DEVANAGARI_VIRAMA && LETTER.test(next);
}

function clusterEndsWithoutSegmenter(text: string): number[] {
  const codePoints = Array.from(text);
  const ends: number[] = [];
  let end = 0;
  codePoints.forEach((codePoint, index) => {
    end += codePoint.length;
    const next = codePoints[index + 1];
    if (next === undefined || !staysWithNext(codePoint, next)) ends.push(end);
  });
  return ends;
}

export function graphemeEnds(text: string): readonly number[] {
  if (typeof Intl.Segmenter !== "function") return clusterEndsWithoutSegmenter(text);
  const segments = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text);
  return Array.from(segments, ({ index, segment }) => index + segment.length);
}

function graphemesIn(sections: readonly ArticleSection[]): number {
  let total = 0;
  for (const { heading, paragraphs } of sections) {
    for (const text of [heading, ...paragraphs]) total += graphemeEnds(text).length;
  }
  return total;
}

export function typingRateFor(english: readonly ArticleSection[], localized: readonly ArticleSection[]): number {
  if (english === localized) return DEFAULT_CHARS_PER_SECOND;
  const englishGraphemes = graphemesIn(english);
  const localizedGraphemes = graphemesIn(localized);
  if (englishGraphemes === 0 || localizedGraphemes === 0) return DEFAULT_CHARS_PER_SECOND;
  return (DEFAULT_CHARS_PER_SECOND * localizedGraphemes) / englishGraphemes;
}

export function isFinished(progress: BlockProgress, length: number): boolean {
  return progress.chars >= length && progress.restMs <= 0;
}
