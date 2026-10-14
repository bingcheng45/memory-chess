"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { SquareName } from "@/lib/game/board";
import type { LabPiece } from "@/lib/round/round";
import { PieceImage } from "./BoardFigure";

/** Where a dragged piece came from: a palette button, or a square of the board. */
export type DragSource =
  | { readonly kind: "palette"; readonly piece: LabPiece }
  | {
      readonly kind: "board";
      readonly square: SquareName;
      readonly piece: LabPiece;
    };

/**
 * The farthest, in CSS pixels, a press may wander and still count as a tap. A finger wobbles, and Chrome sends a tap's
 * click while it has moved at most 15px, so a finger gets exactly that: a press the browser clicks for stays a tap
 * here, and one it does not is a drag.
 */
const TAP_SLOP_PX = { mouse: 6, finger: 15 } as const;
/** How long after a drag's release its click may still come: a phone sends it in a task of its own, later. */
const DRAG_CLICK_MS = 400;
/** How far above a finger the ghost rides, as a share of its size, so the finger does not hide it. */
const TOUCH_LIFT = 0.75;
/** The ghost's size where nothing on the page has one to lend it. */
const FALLBACK_GHOST_PX = 48;

type Gesture<S extends DragSource> =
  | {
      readonly phase: "pressed";
      readonly pointerId: number;
      readonly source: S;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly phase: "dragging";
      readonly pointerId: number;
      readonly source: S;
      readonly lift: number;
    }
  | { readonly phase: "spent"; readonly pointerId: number };

interface Ghost {
  readonly piece: LabPiece;
  readonly size: number;
  readonly transform: string;
}

interface PieceDragOptions<S extends DragSource> {
  /** False while nothing can be dragged. A drag in flight then ends where it is, and its release does nothing. */
  readonly enabled: boolean;
  /**
   * Called once the press has moved far enough to be a drag. Returning false refuses the drag: no ghost follows, and
   * the press no longer counts as a tap.
   */
  readonly onStart?: (source: S) => boolean;
  /** The square under the pointer on release, or null when it was let go off the board. */
  readonly onDrop: (source: S, square: SquareName | null) => void;
}

export interface PieceDrag<S extends DragSource> {
  /** The press handler for one draggable element; the rest of the gesture is heard on the window. */
  readonly bind: (source: S) => { onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void };
  /** The source of the drag in flight, so it can be drawn as lifted. */
  readonly dragging: S | null;
  readonly ghost: ReactNode;
}

/** The live board square under a point. The ghost and the pieces ignore the pointer, so the hit is the square. */
function squareAt(x: number, y: number): HTMLElement | null {
  return document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-live] > [data-coordinate]") ?? null;
}

function ghostTransform(x: number, y: number, size: number, lift: number): string {
  return `translate3d(${x - size / 2}px, ${y - size / 2 - lift}px, 0)`;
}

/**
 * The click a browser sends after a drag's release belongs to the drag, not to the element under it. It is held back
 * until it comes, the next press starts, or DRAG_CLICK_MS pass, whichever is first.
 */
function swallowNextClick(): void {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    disarm();
  };
  const disarm = () => {
    clearTimeout(timer);
    window.removeEventListener("click", swallow, true);
    window.removeEventListener("pointerdown", disarm, true);
  };
  window.addEventListener("click", swallow, true);
  window.addEventListener("pointerdown", disarm, true);
  const timer = setTimeout(disarm, DRAG_CLICK_MS);
}

/**
 * Drag and drop with Pointer Events, so mouse, touch and pen take one path. A press that stays within a few pixels is
 * left alone and arrives as the element's own click, which keeps tap-to-place and the keyboard working unchanged.
 */
export function usePieceDrag<S extends DragSource>({ enabled, onStart, onDrop }: PieceDragOptions<S>): PieceDrag<S> {
  const gesture = useRef<Gesture<S> | null>(null);
  const unlisten = useRef<(() => void) | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const ghostNode = useRef<HTMLDivElement | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [dragging, setDragging] = useState<S | null>(null);

  const highlight = useCallback((square: HTMLElement | null) => {
    if (square === target.current) return;
    target.current?.removeAttribute("data-drop-target");
    square?.setAttribute("data-drop-target", "");
    target.current = square;
  }, []);

  const settle = useCallback(
    (next: Gesture<S> | null) => {
      gesture.current = next;
      if (!next) {
        unlisten.current?.();
        unlisten.current = null;
      }
      highlight(null);
      setGhost(null);
      setDragging(null);
    },
    [highlight],
  );

  useEffect(() => {
    if (!dragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const current = gesture.current;
      if (event.key !== "Escape" || current?.phase !== "dragging") return;
      event.preventDefault();
      settle({ phase: "spent", pointerId: current.pointerId });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dragging, settle]);

  useEffect(() => {
    const current = gesture.current;
    if (!enabled && current && current.phase !== "spent") settle({ phase: "spent", pointerId: current.pointerId });
  }, [enabled, settle]);

  useEffect(
    () => () => {
      unlisten.current?.();
      target.current?.removeAttribute("data-drop-target");
    },
    [],
  );

  /**
   * The rest of a press, heard on the window for as long as it lasts, so the release still lands when the element it
   * started on stops being draggable mid-drag.
   */
  const follow = (pointerId: number, element: HTMLElement) => {
    const onMove = (event: PointerEvent) => {
      const current = gesture.current;
      if (current?.pointerId !== event.pointerId) return;
      if (current.phase === "pressed") {
        const slop = event.pointerType === "mouse" ? TAP_SLOP_PX.mouse : TAP_SLOP_PX.finger;
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) <= slop) return;
        if (onStart && !onStart(current.source)) {
          gesture.current = { phase: "spent", pointerId };
          return;
        }
        const square = document.querySelector("[data-live] > [data-coordinate]") ?? element;
        const size = square.getBoundingClientRect().width || FALLBACK_GHOST_PX;
        const lift = event.pointerType === "touch" ? size * TOUCH_LIFT : 0;
        gesture.current = { phase: "dragging", pointerId, source: current.source, lift };
        setGhost({ piece: current.source.piece, size, transform: ghostTransform(event.clientX, event.clientY, size, lift) });
        setDragging(current.source);
      } else if (current.phase === "dragging" && ghostNode.current) {
        const size = ghostNode.current.offsetWidth;
        ghostNode.current.style.transform = ghostTransform(event.clientX, event.clientY, size, current.lift);
      }
      const active = gesture.current;
      // The piece lands where the ghost is drawn, which rides above a finger.
      if (active?.phase === "dragging") highlight(squareAt(event.clientX, event.clientY - active.lift));
    };
    const onUp = (event: PointerEvent) => {
      const current = gesture.current;
      if (current?.pointerId !== event.pointerId) return;
      if (current.phase === "dragging") {
        const square = squareAt(event.clientX, event.clientY - current.lift)?.dataset.coordinate as SquareName | undefined;
        onDrop(current.source, square ?? null);
      }
      if (current.phase !== "pressed") swallowNextClick();
      settle(null);
    };
    // The release clears the gesture before capture goes, so a capture lost with a gesture still open is a cancel.
    const onCancel = (event: PointerEvent) => {
      if (gesture.current?.pointerId === event.pointerId) settle(null);
    };
    const listeners = [
      ["pointermove", onMove],
      ["pointerup", onUp],
      ["pointercancel", onCancel],
      ["lostpointercapture", onCancel],
    ] as const;
    for (const [type, listener] of listeners) window.addEventListener(type, listener, true);
    unlisten.current = () => {
      for (const [type, listener] of listeners) window.removeEventListener(type, listener, true);
    };
  };

  const bind: PieceDrag<S>["bind"] = (source) => ({
    onPointerDown: (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      // A new primary press means the last one is over, even if its release never reached us.
      if (gesture.current) settle(null);
      gesture.current = { phase: "pressed", pointerId: event.pointerId, source, x: event.clientX, y: event.clientY };
      follow(event.pointerId, event.currentTarget);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
  });

  const ghostElement =
    ghost &&
    createPortal(
      <div
        ref={ghostNode}
        className="lab-drag-ghost"
        aria-hidden="true"
        style={{ width: ghost.size, height: ghost.size, transform: ghost.transform }}
      >
        <PieceImage piece={ghost.piece} />
      </div>,
      document.body,
    );

  return { bind, dragging, ghost: ghostElement };
}
