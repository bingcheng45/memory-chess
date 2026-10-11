"use client";

import { memo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import {
  isDarkSquare,
  PIECE_TYPE_ORDER,
  squareVerdict,
  type LabPiece,
  type RoundAction,
  type RoundState,
} from "@/lib/round/round";
import type { PieceColor } from "@/types/chess";
import { BoardFigure, PieceImage, usePieceName } from "./BoardFigure";
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

function squareView(state: RoundState, square: SquareName) {
  switch (state.phase) {
    case "idle":
      return { piece: undefined, ghost: undefined, mark: undefined };
    case "study":
      return { piece: state.target[square], ghost: undefined, mark: undefined };
    case "rebuild":
      return { piece: state.placed[square], ghost: undefined, mark: undefined };
    case "scored":
      return {
        piece: state.placed[square],
        ghost: state.placed[square] ? undefined : state.target[square],
        mark: squareVerdict(state.target, state.placed, square),
      };
  }
}

interface RoundBoardProps {
  readonly state: RoundState;
  readonly dispatch: (action: RoundAction) => void;
  readonly copy: RoundCopy;
  readonly coordinates?: boolean;
}

// Memoized: the round's clock ticks every frame, and the board changes only with the round.
export const RoundBoard = memo(function RoundBoard({ state, dispatch, copy, coordinates = true }: RoundBoardProps) {
  const t = useTranslations(copy);
  const pieceName = usePieceName();
  const [focusIndex, setFocusIndex] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const live = state.phase === "rebuild";
  const navigable = live || state.phase === "scored";

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const to = nextIndex(focusIndex, event.key);
    if (to === null) return;
    event.preventDefault();
    setFocusIndex(to);
    cells.current[to]?.focus();
  };

  return (
    <BoardFigure coordinates={coordinates}>
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
              tabIndex={navigable && index === focusIndex ? 0 : -1}
              aria-disabled={!live}
              aria-label={
                occupant ? t("squareWith", { square, piece: pieceName(occupant) }) : t("squareEmpty", { square })
              }
              onFocus={() => setFocusIndex(index)}
              onClick={() => live && dispatch({ type: "tapSquare", square, now: performance.now() })}
            >
              {occupant && <PieceImage piece={occupant} />}
              {view.ghost && <PieceImage piece={view.ghost} state="ghost" />}
            </button>
          );
        })}
      </div>
    </BoardFigure>
  );
});

interface RoundPaletteProps {
  readonly state: RoundState;
  readonly dispatch: (action: RoundAction) => void;
  readonly copy: RoundCopy;
}

export const RoundPalette = memo(function RoundPalette({ state, dispatch, copy }: RoundPaletteProps) {
  const t = useTranslations(copy);
  const pieceName = usePieceName();
  const live = state.phase === "rebuild";
  const selected = state.phase === "rebuild" ? state.selected : null;

  return (
    <div className="lab-palette" role="toolbar" aria-label={t("paletteLabel")}>
      {PALETTE.map((piece) => (
        <button
          key={`${piece.color}-${piece.type}`}
          type="button"
          disabled={!live}
          aria-pressed={selected?.color === piece.color && selected.type === piece.type}
          aria-label={pieceName(piece)}
          onClick={() => dispatch({ type: "select", piece })}
        >
          <PieceImage piece={piece} />
        </button>
      ))}
    </div>
  );
});
