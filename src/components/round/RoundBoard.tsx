"use client";

import { memo, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import {
  hiddenAnswer,
  isDarkSquare,
  PIECE_TYPE_ORDER,
  remainingOf,
  squareVerdict,
  type BoardAction,
  type LabPiece,
  type Refusal,
  type RoundState,
} from "@/lib/round/round";
import type { PieceColor } from "@/types/chess";
import { BoardFigure, PieceImage, usePieceName } from "./BoardFigure";
import { usePieceDrag, type DragSource } from "./usePieceDrag";
import "./round.css";

/** Where a round's words come from: the homepage calibration (English only) or the game (every locale). */
export type RoundCopy = "home.lab.calibrate" | "game.round";

const PALETTE: readonly LabPiece[] = (["white", "black"] as PieceColor[]).flatMap((color) =>
  PIECE_TYPE_ORDER.map((type) => ({ color, type })),
);

const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 8,
  ArrowUp: -8,
};

function nextIndex(from: number, key: string): number | null {
  const step = ARROW_STEPS[key];
  if (step === undefined) return null;
  const to = from + step;
  const leavesRow = Math.abs(step) === 1 && Math.floor(to / 8) !== Math.floor(from / 8);
  return to < 0 || to > 63 || leavesRow ? null : to;
}

interface SquareView {
  readonly piece?: LabPiece;
  readonly ghost?: LabPiece;
  /** The piece that belonged under a wrong one, which the square shows beside it. */
  readonly answer?: LabPiece;
  readonly mark?: string;
}

function squareView(state: RoundState, square: SquareName): SquareView {
  switch (state.phase) {
    case "idle":
    case "ready":
    case "countdown":
      return { piece: undefined, ghost: undefined, mark: undefined };
    case "study":
      return { piece: state.config.blindfold ? undefined : state.target[square], ghost: undefined, mark: undefined };
    case "rebuild":
      return { piece: state.placed[square], ghost: undefined, mark: undefined };
    case "scored":
      return {
        piece: state.placed[square],
        ghost: state.placed[square] ? undefined : state.target[square],
        answer: hiddenAnswer(state.target, state.placed, square),
        mark: squareVerdict(state.target, state.placed, square),
      };
  }
}

interface RoundBoardProps {
  readonly state: RoundState;
  readonly dispatch: (action: BoardAction) => void;
  readonly copy: RoundCopy;
}

// Memoized: the round's clock ticks every frame, and the board changes only with the round.
export const RoundBoard = memo(function RoundBoard({ state, dispatch, copy }: RoundBoardProps) {
  const t = useTranslations(copy);
  const pieceName = usePieceName();
  const [focusIndex, setFocusIndex] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const live = state.phase === "rebuild";
  const navigable = live || state.phase === "scored";
  const drag = usePieceDrag<Extract<DragSource, { kind: "board" }>>({
    enabled: live,
    onDrop: (source, square) => {
      if (square === source.square) return;
      dispatch(
        square
          ? { type: "move", from: source.square, to: square, now: performance.now() }
          : { type: "remove", square: source.square },
      );
    },
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const to = nextIndex(focusIndex, event.key);
    if (to === null) return;
    event.preventDefault();
    setFocusIndex(to);
    cells.current[to]?.focus();
  };

  return (
    <BoardFigure>
      <div
        className="lab-board lab-cal-grid"
        role="group"
        aria-label={t("boardLabel")}
        data-live={live || undefined}
        data-round-phase={state.phase}
        onKeyDown={onKeyDown}
      >
        {BOARD_SQUARES.map((square, index) => {
          const view = squareView(state, square);
          const occupant = view.piece;
          const draggable = live && occupant;
          return (
            <button
              key={square}
              type="button"
              ref={(node) => {
                cells.current[index] = node;
              }}
              className="lab-cell"
              data-coordinate={square}
              data-dark={isDarkSquare(index) || undefined}
              data-mark={view.mark}
              data-split={view.answer ? "" : undefined}
              data-draggable={draggable ? "" : undefined}
              data-lifted={drag.dragging?.kind === "board" && drag.dragging.square === square ? "" : undefined}
              {...(draggable ? drag.bind({ kind: "board", square, piece: occupant }) : undefined)}
              tabIndex={navigable && index === focusIndex ? 0 : -1}
              aria-disabled={!live}
              aria-label={
                occupant && view.answer
                  ? t("squareSwapped", { square, piece: pieceName(occupant), answer: pieceName(view.answer) })
                  : occupant
                    ? t("squareWith", { square, piece: pieceName(occupant) })
                    : t("squareEmpty", { square })
              }
              onFocus={() => setFocusIndex(index)}
              onClick={() => live && dispatch({ type: "tapSquare", square, now: performance.now() })}
            >
              {occupant && <PieceImage piece={occupant} state={view.answer ? "placed" : "on"} />}
              {view.ghost && <PieceImage piece={view.ghost} state="ghost" />}
              {view.answer && <PieceImage piece={view.answer} state="answer" />}
            </button>
          );
        })}
      </div>
      {drag.ghost}
    </BoardFigure>
  );
});

interface RoundPaletteProps {
  readonly state: RoundState;
  readonly dispatch: (action: BoardAction) => void;
  readonly copy: RoundCopy;
}

/** The sentence for the last piece the player reached for after every copy was on the board, if any. */
function useRefusalMessage(refused: Refusal | null, copy: RoundCopy): string | null {
  const t = useTranslations(copy);
  return refused && t(`usedUp.${refused.piece.color}.${refused.piece.type}`);
}

/**
 * The refusal for a host's live region. Each new attempt is a new node, so a screen reader speaks a repeat too, and
 * the region's own text is never rewritten, so clearing a refusal announces nothing.
 */
export function RefusalAnnouncement({ state, copy }: { state: RoundState; copy: RoundCopy }) {
  const refused = state.phase === "rebuild" ? state.refused : null;
  const message = useRefusalMessage(refused, copy);
  return refused && <span key={refused.attempt}> {message}</span>;
}

/** How long a refusal stays on screen; the live region has already spoken it. */
const NOTICE_MS = 3200;

function useNoticeVisible(refused: Refusal | null): boolean {
  const [expired, setExpired] = useState<Refusal | null>(null);
  useEffect(() => {
    if (!refused) return;
    const timer = setTimeout(() => setExpired(refused), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [refused]);
  return refused !== null && expired !== refused;
}

export const RoundPalette = memo(function RoundPalette({ state, dispatch, copy }: RoundPaletteProps) {
  const t = useTranslations(copy);
  const pieceName = usePieceName();
  const live = state.phase === "rebuild";
  const selected = live ? state.selected : null;
  const placed = live ? state.placed : {};
  const refused = live ? state.refused : null;
  const message = useRefusalMessage(refused, copy);
  const noticeVisible = useNoticeVisible(refused);
  const drag = usePieceDrag({
    enabled: live,
    onStart: (source) => {
      dispatch({ type: "grab", piece: source.piece });
      return remainingOf(placed, source.piece) > 0;
    },
    onDrop: (source, square) => {
      if (square) dispatch({ type: "place", piece: source.piece, square, now: performance.now() });
    },
  });

  return (
    <div className="lab-palette" role="toolbar" aria-label={t("paletteLabel")}>
      {PALETTE.map((piece) => {
        const left = remainingOf(placed, piece);
        return (
          <button
            key={`${piece.color}-${piece.type}`}
            type="button"
            disabled={!live}
            data-used-up={live && left <= 0 ? "" : undefined}
            aria-pressed={selected?.color === piece.color && selected.type === piece.type}
            aria-label={live ? t("paletteItem", { piece: pieceName(piece), count: left }) : pieceName(piece)}
            onClick={() => dispatch({ type: "select", piece })}
            {...(live ? drag.bind({ kind: "palette", piece }) : undefined)}
          >
            <PieceImage piece={piece} />
            {live && (
              <span className="lab-palette-count" aria-hidden="true">
                {left}
              </span>
            )}
          </button>
        );
      })}
      {noticeVisible && message && (
        <p key={refused?.attempt} className="lab-palette-note" aria-hidden="true">
          {message}
        </p>
      )}
      {drag.ghost}
    </div>
  );
});
