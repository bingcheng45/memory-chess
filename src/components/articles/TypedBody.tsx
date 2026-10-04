"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, type Dispatch, type RefObject } from "react";
import { clearArrival, peekArrival } from "@/components/articles/articleArrival";
import { prefersReducedMotion } from "@/components/articles/articleFlight";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import {
  BLOCK_START,
  advance,
  isFinished,
  placementOf,
  wholeCharacterCut,
  type BlockKind,
} from "@/components/articles/typingPace";
import { readingFont } from "@/lib/articles/readingFont";
import type { ArticleSection } from "@/lib/articles/schema";
import "./typedBody.css";

type TypedBodyProps = { slug: string; sections: readonly ArticleSection[] };

type Block = { readonly kind: BlockKind; readonly text: string };
type BlockStage = "shown" | "current" | "waiting";
type SpanRef = RefObject<HTMLSpanElement | null>;
type TypingState =
  | { readonly phase: "idle" }
  | { readonly phase: "typing"; readonly block: number; readonly hasTyped: boolean; readonly mayStart: Promise<void> }
  | { readonly phase: "done" };
type TypingEvent =
  | { readonly type: "firstCharTyped" }
  | { readonly type: "blockTyped" }
  | { readonly type: "showAll" };

const SHOW_ALL_LABEL = "Show all text";
const HELD_BLOCK_CHECK_MS = 250;
const IDLE: TypingState = { phase: "idle" };
const DONE: TypingState = { phase: "done" };
const UNTYPED_CLASS = "article-untyped";
const CARET_CLASS = "article-caret";
const BODY_CLASS = `${readingFont.className} mt-[34px] outline-none max-w-[66ch] text-[18.5px] leading-[1.75] text-text-secondary min-[561px]:text-xl`;
const BLOCK_TAG = { heading: "h2", paragraph: "p" } as const;
const BLOCK_CLASS = {
  heading:
    "mb-[0.55em] mt-[1.8em] text-[22px] font-bold leading-tight tracking-[-0.01em] text-white [font-family:var(--font-geist-sans)] first:mt-0",
  paragraph: "mb-[1.3em]",
} as const;
const SHOW_ALL_CLASS =
  "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 inline-flex min-h-11 -translate-x-1/2 " +
  "items-center rounded-full border border-peach-500/35 bg-bg-card px-5 text-sm font-medium text-text-secondary " +
  `shadow-lg shadow-black/50 hover:border-peach-400/60 hover:text-white active:bg-bg-light ${ARTICLE_FOCUS_RING}`;

function blocksOf(sections: readonly ArticleSection[]): readonly Block[] {
  return sections.flatMap<Block>((section) => [
    { kind: "heading", text: section.heading },
    ...section.paragraphs.map<Block>((text) => ({ kind: "paragraph", text })),
  ]);
}

function initialState({ slug, blockCount }: { slug: string; blockCount: number }): TypingState {
  const arrival = peekArrival(slug);
  if (arrival === null || blockCount === 0 || prefersReducedMotion()) return IDLE;
  return { phase: "typing", block: 0, hasTyped: false, mayStart: arrival.mayStart };
}

function nextState(state: TypingState, event: TypingEvent, blockCount: number): TypingState {
  if (state.phase !== "typing") return state;
  if (event.type === "firstCharTyped") return state.hasTyped ? state : { ...state, hasTyped: true };
  const isLastBlock = state.block + 1 >= blockCount;
  if (event.type === "showAll" || isLastBlock) return DONE;
  return { ...state, block: state.block + 1 };
}

function stageOf(state: TypingState, index: number): BlockStage {
  if (state.phase !== "typing" || index < state.block) return "shown";
  return index === state.block ? "current" : "waiting";
}

function typeOut(block: Block, shown: HTMLElement, rest: HTMLElement, emit: Dispatch<TypingEvent>): () => void {
  const pace = { length: block.text.length, kind: block.kind };
  const element = shown.parentElement ?? shown;
  let progress = BLOCK_START;
  let previousFrame: number | null = null;
  let heldCheck: ReturnType<typeof setTimeout> | undefined;
  let frame = requestAnimationFrame(step);

  function step(now: number) {
    const elapsedMs = previousFrame === null ? 0 : now - previousFrame;
    const placement = placementOf(element.getBoundingClientRect(), window.innerHeight);
    const next = advance(progress, pace, elapsedMs, placement);
    if (next.chars !== progress.chars) {
      if (progress.chars === 0) emit({ type: "firstCharTyped" });
      const cut = wholeCharacterCut(block.text, next.chars);
      shown.textContent = block.text.slice(0, cut);
      rest.textContent = block.text.slice(cut);
    }
    previousFrame = now;
    progress = next;
    if (isFinished(progress, pace.length)) {
      emit({ type: "blockTyped" });
    } else if (progress.chars === 0 && placement === "below") {
      heldCheck = setTimeout(() => {
        frame = requestAnimationFrame(step);
      }, HELD_BLOCK_CHECK_MS);
    } else {
      frame = requestAnimationFrame(step);
    }
  }

  return () => {
    clearTimeout(heldCheck);
    cancelAnimationFrame(frame);
  };
}

function BlockText({ text, stage, shown, rest }: { text: string; stage: BlockStage; shown: SpanRef; rest: SpanRef }) {
  if (stage === "shown") return text;
  if (stage === "waiting") return <span className={UNTYPED_CLASS}>{text}</span>;
  return (
    <>
      <span ref={shown} />
      <span className={CARET_CLASS} aria-hidden="true" />
      <span ref={rest} className={UNTYPED_CLASS}>
        {text}
      </span>
    </>
  );
}

function useBlockTyping(state: TypingState, blocks: readonly Block[], dispatch: Dispatch<TypingEvent>) {
  const shown = useRef<HTMLSpanElement>(null);
  const rest = useRef<HTMLSpanElement>(null);

  const typing = state.phase === "typing" ? state : null;
  const block = typing ? blocks[typing.block] : null;
  const mayStart = typing?.mayStart;

  useEffect(() => {
    if (!block || !mayStart || !shown.current || !rest.current) return;
    const [shownSpan, restSpan] = [shown.current, rest.current];
    let isCancelled = false;
    let stopTyping = () => {};
    mayStart.then(() => {
      if (!isCancelled) stopTyping = typeOut(block, shownSpan, restSpan, dispatch);
    });
    return () => {
      isCancelled = true;
      stopTyping();
    };
  }, [block, mayStart, dispatch]);

  return { shown, rest };
}

function focusWithoutScrolling(element: HTMLElement | null) {
  element?.focus({ preventScroll: true });
}

function useShowAllWhenHidden(isTyping: boolean, dispatch: Dispatch<TypingEvent>) {
  useEffect(() => {
    if (!isTyping) return;
    const showAllWhenHidden = () => {
      if (document.hidden) dispatch({ type: "showAll" });
    };
    showAllWhenHidden();
    document.addEventListener("visibilitychange", showAllWhenHidden);
    return () => document.removeEventListener("visibilitychange", showAllWhenHidden);
  }, [isTyping, dispatch]);
}

export default function TypedBody({ slug, sections }: TypedBodyProps) {
  const blocks = useMemo(() => blocksOf(sections), [sections]);
  const [state, dispatch] = useReducer(
    (current: TypingState, event: TypingEvent) => nextState(current, event, blocks.length),
    { slug, blockCount: blocks.length },
    initialState,
  );
  const body = useRef<HTMLDivElement>(null);
  const isTyping = state.phase === "typing";
  const { shown, rest } = useBlockTyping(state, blocks, dispatch);

  useEffect(clearArrival, []);
  useShowAllWhenHidden(isTyping, dispatch);

  // React 19 runs a ref's cleanup before it removes the node, so a focused pill is still the active element here.
  // That order is observed, not guaranteed. The two focus tests in TypedBody.pill.test.tsx pin it.
  const keepFocusWhenPillGoes = useCallback(
    (pill: HTMLButtonElement) => () => {
      if (document.activeElement === pill) focusWithoutScrolling(body.current);
    },
    [],
  );

  function showAll() {
    focusWithoutScrolling(body.current);
    dispatch({ type: "showAll" });
  }

  return (
    <>
      {state.phase === "typing" && state.hasTyped ? (
        <button ref={keepFocusWhenPillGoes} type="button" onClick={showAll} className={SHOW_ALL_CLASS}>
          {SHOW_ALL_LABEL}
        </button>
      ) : null}
      <div ref={body} tabIndex={-1} data-article-body data-article-typing={state.phase} className={BODY_CLASS}>
        {blocks.map((block, index) => {
          const Tag = BLOCK_TAG[block.kind];
          return (
            <Tag key={index} className={BLOCK_CLASS[block.kind]}>
              <BlockText text={block.text} stage={stageOf(state, index)} shown={shown} rest={rest} />
            </Tag>
          );
        })}
      </div>
    </>
  );
}
