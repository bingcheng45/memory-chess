"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
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

/** Movement, in CSS pixels, a press may wander and still count as a tap. */
const TAP_SLOP_PX = 6;
/** How far above a finger the ghost rides, as a share of its size, so the finger does not hide it. */
const TOUCH_LIFT = 0.75;
/** The ghost's size where nothing on the page has one to lend it. */
const FALLBACK_GHOST_PX = 48;

type Gesture =
  | {
      readonly phase: "pressed";
      readonly pointerId: number;
      readonly source: DragSource;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly phase: "dragging";
      readonly pointerId: number;
      readonly source: DragSource;
      readonly lift: number;
    }
  | { readonly phase: "spent"; readonly pointerId: number };

interface Ghost {
  readonly piece: LabPiece;
  readonly size: number;
  readonly transform: string;
}

interface PieceDragOptions {
  /**
   * Called once the press has moved far enough to be a drag. Returning false refuses the drag: no ghost follows, and
   * the press no longer counts as a tap.
   */
  readonly onStart?: (source: DragSource) => boolean;
  /** The square under the pointer on release, or null when it was let go off the board. */
  readonly onDrop: (source: DragSource, square: SquareName | null) => void;
}

export interface PieceDrag {
  /** Pointer handlers for one draggable element. */
  readonly bind: (source: DragSource) => {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  };
  /** The source of the drag in flight, so it can be drawn as lifted. */
  readonly dragging: DragSource | null;
  readonly ghost: ReactNode;
}

/** The live board square under a point. The ghost and the pieces ignore the pointer, so the hit is the square. */
function squareAt(x: number, y: number): HTMLElement | null {
  return document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-live] > [data-coordinate]") ?? null;
}

function ghostTransform(x: number, y: number, size: number, lift: number): string {
  return `translate3d(${x - size / 2}px, ${y - size / 2 - lift}px, 0)`;
}

/** The click a browser sends after a drag's release belongs to the drag, not to the element it started on. */
function swallowNextClick(): void {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
}

/**
 * Drag and drop with Pointer Events, so mouse, touch and pen take one path. A press that stays within a few pixels is
 * left alone and arrives as the element's own click, which keeps tap-to-place and the keyboard working unchanged.
 */
export function usePieceDrag({ onStart, onDrop }: PieceDragOptions): PieceDrag {
  const gesture = useRef<Gesture | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const ghostNode = useRef<HTMLDivElement | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [dragging, setDragging] = useState<DragSource | null>(null);

  const highlight = useCallback((square: HTMLElement | null) => {
    if (square === target.current) return;
    target.current?.removeAttribute("data-drop-target");
    square?.setAttribute("data-drop-target", "");
    target.current = square;
  }, []);

  const settle = useCallback(
    (next: Gesture | null) => {
      gesture.current = next;
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

  useEffect(() => () => target.current?.removeAttribute("data-drop-target"), []);

  const bind: PieceDrag["bind"] = (source) => ({
    onPointerDown: (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      // A new primary press means the last one is over, even if its release never reached us.
      if (gesture.current) settle(null);
      gesture.current = { phase: "pressed", pointerId: event.pointerId, source, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event) => {
      const current = gesture.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase === "pressed") {
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < TAP_SLOP_PX) return;
        if (onStart && !onStart(current.source)) {
          gesture.current = { phase: "spent", pointerId: current.pointerId };
          return;
        }
        const square = document.querySelector("[data-live] > [data-coordinate]") ?? event.currentTarget;
        const size = square.getBoundingClientRect().width || FALLBACK_GHOST_PX;
        const lift = event.pointerType === "touch" ? size * TOUCH_LIFT : 0;
        gesture.current = { phase: "dragging", pointerId: current.pointerId, source: current.source, lift };
        setGhost({ piece: current.source.piece, size, transform: ghostTransform(event.clientX, event.clientY, size, lift) });
        setDragging(current.source);
      } else if (current.phase === "dragging" && ghostNode.current) {
        const size = ghostNode.current.offsetWidth;
        ghostNode.current.style.transform = ghostTransform(event.clientX, event.clientY, size, current.lift);
      }
      if (gesture.current?.phase === "dragging") highlight(squareAt(event.clientX, event.clientY));
    },
    onPointerUp: (event) => {
      const current = gesture.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase === "dragging") {
        const square = squareAt(event.clientX, event.clientY)?.dataset.coordinate as SquareName | undefined;
        onDrop(current.source, square ?? null);
      }
      if (current.phase !== "pressed") swallowNextClick();
      settle(null);
    },
    onPointerCancel: (event) => {
      if (gesture.current?.pointerId === event.pointerId) settle(null);
    },
    // The release clears the gesture before capture goes, so a capture lost with a gesture still open is a cancel.
    onLostPointerCapture: (event) => {
      if (gesture.current?.pointerId === event.pointerId) settle(null);
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
