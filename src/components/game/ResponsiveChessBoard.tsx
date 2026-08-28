"use client";

import React, { useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useElementSize } from "@/hooks/useElementSize";
import { ChessPiece, Position } from "@/types/chess";
import { getPieceImageUrl } from "@/utils/chessPieces";

/**
 * Square size, in pixels, below which the board is treated as compact. Every
 * phone in portrait sits under this once the board has taken the width the
 * page gutter leaves it; tablets and desktops sit above it.
 */
const COMPACT_SQUARE_SIZE = 56;

/** Beyond this the board stops growing and simply centres in its space. */
const MAX_BOARD_SIZE = 600;

export type SquareFeedbackStatus = "correct" | "incorrect" | "missing";
export type SquareFeedbackMap = Readonly<Record<string, SquareFeedbackStatus>>;

interface ResponsiveChessBoardProps {
  pieces: ChessPiece[];
  selectedSquare?: Position | null;
  isInteractive?: boolean;
  onSquareClick?: (position: Position) => void;
  isLoading?: boolean;
  showCoordinates?: boolean;
  renderOverlay?: (squareSize: number) => React.ReactNode;
  squareFeedback?: SquareFeedbackMap;
}

export default function ResponsiveChessBoard({
  pieces = [],
  selectedSquare = null,
  isInteractive = true,
  onSquareClick,
  isLoading = false,
  showCoordinates = true,
  renderOverlay,
  squareFeedback,
}: ResponsiveChessBoardProps) {
  const t = useTranslations("game.board");

  /**
   * Screen-reader description of a piece, e.g. "white pawn".
   *
   * Colour and type are internal enum values, so the colour+piece phrase is
   * looked up whole rather than composed from two keys. Composing it would
   * force every gendered language to agree an adjective with a noun it cannot
   * see -- German needs "weisser Bauer" but "weisse Dame", Russian "белая
   * пешка" but "белый конь" -- which no single template can express.
   */
  const describePiece = useCallback(
    (piece: ChessPiece) => t(`pieces.${piece.color}.${piece.type}`),
    [t],
  );


  /**
   * The board is sized by CSS -- a square that grows to fill whatever box it
   * is given -- and then measures itself, rather than being told a pixel size
   * worked out from the viewport.
   *
   * Working the size out ahead of time means restating elsewhere how tall the
   * rest of the screen is, and that restatement drifts: a row that grows by a
   * few pixels leaves the board overflowing or short, with nothing to say so.
   * Measuring asks the browser what it actually did.
   */
  const areaRef = useRef<HTMLDivElement>(null);
  const area = useElementSize(areaRef);

  /**
   * A square cannot be expressed with `aspect-ratio` alone here: a block that
   * is told to fill its width keeps that width when `max-height` clamps it,
   * and comes out oblong. Taking the smaller of the two measured sides gives a
   * square that fits either way.
   *
   * Where the area has no height of its own -- a column that is as tall as
   * whatever it contains -- the width is the only constraint.
   */
  const size = Math.min(
    area.width,
    area.height > 0 ? area.height : area.width,
    MAX_BOARD_SIZE,
  );

  const squareSize = size / 8;
  const padding = Math.max(4, Math.floor(squareSize / 8));
  const fontSize = { coordinates: Math.max(8, Math.floor(squareSize / 4)) };

  // Files and ranks for coordinate labels
  const files = useMemo(() => ["a", "b", "c", "d", "e", "f", "g", "h"], []);
  const ranks = useMemo(() => [8, 7, 6, 5, 4, 3, 2, 1], []);

  // Calculate board styles
  const boardStyle = useMemo(
    () => ({
      width: `${size}px`,
      height: `${size}px`,
      boxSizing: "border-box" as const,
      userSelect: "none" as const,
      WebkitUserSelect: "none" as const,
    }),
    [size],
  );

  /**
   * Thickness of the selected-square ring.
   *
   * Measured against the square it is drawn in rather than the viewport: the
   * board is sized continuously from the available space, so the square is
   * what decides whether a 2px ring reads as a highlight or as a heavy border.
   * A phone in portrait lands around a 43px square and gets the thinner ring;
   * a tablet or desktop board reaches the 75px square cap and gets the full 2px.
   */
  const selectionRingWidth = squareSize < COMPACT_SQUARE_SIZE ? 1 : 2;

  // Calculate square styles
  const getSquareStyle = (file: number, rank: number) => {
    const isDark = (file + rank) % 2 === 1;
    const isSelected =
      selectedSquare &&
      selectedSquare.file === file &&
      selectedSquare.rank === rank;

    const feedback = squareFeedback?.[`${file}-${rank}`];
    const feedbackShadow = {
      correct: "inset 0 0 0 3px rgba(34, 197, 94, 0.9)",
      incorrect: "inset 0 0 0 3px rgba(239, 68, 68, 0.95)",
      missing: "inset 0 0 0 3px rgba(245, 158, 11, 0.95)",
    } as const;

    return {
      // The grid gives each square its cell; filling it keeps the squares
      // exact even before the board has been measured.
      width: "100%",
      height: "100%",
      backgroundColor: isDark ? "var(--board-dark)" : "var(--board-light)",
      border: "1px solid rgba(0, 0, 0, 0.15)",
      position: "relative" as const,
      outline: isSelected
        ? `${selectionRingWidth}px solid rgba(0, 128, 255, 0.8)`
        : "none",
      // Draw the ring inside the square. An outline sits outside the box by
      // default, where the squares painted after it -- the ones to the right
      // and below -- cover it, and where the board's overflow clip cuts it off
      // along the outer files and ranks, so only its top and left edges
      // survived.
      outlineOffset: `-${selectionRingWidth}px`,
      // Opt out of the browser's double-tap-to-zoom delay so a tap reaches the
      // game immediately, while still allowing the page to be panned.
      touchAction: "manipulation" as const,
      transition: "outline 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
      boxShadow: feedback ? feedbackShadow[feedback] : "none",
    };
  };

  // Calculate coordinate label styles
  const coordinateStyle = {
    fontSize: `${fontSize.coordinates}px`,
    opacity: 0.7,
    position: "absolute" as const,
    color: "black",
  };

  /**
   * Handle activation of a square.
   *
   * Squares listen for `click` only. A mouse click and a touch tap both
   * produce exactly one click event, so every gesture reaches the game once
   * on desktop and on mobile alike. Listening for `touchend` as well used to
   * double up, which was previously papered over with a timer that dropped
   * taps instead.
   */
  const handleSquareClick = useCallback(
    (file: number, rank: number) => {
      if (!isInteractive || isLoading || !onSquareClick) return;

      onSquareClick({ file, rank });
    },
    [isInteractive, isLoading, onSquareClick],
  );

  // Find piece at a specific position
  const getPieceAt = (file: number, rank: number): ChessPiece | undefined => {
    return pieces.find(
      (p) => p.position.file === file && p.position.rank === rank,
    );
  };

  return (
    <div
      ref={areaRef}
      className="flex h-full w-full items-center justify-center"
    >
    <div
      className="game-container relative select-none overflow-hidden rounded-lg shadow-lg"
      style={boardStyle}
      onDragStart={(event) => event.preventDefault()}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Board grid */}
      <div
        className="grid grid-cols-8 grid-rows-8 h-full w-full"
        style={{ gap: "0px" }}
      >
        {/* Generate all 64 squares */}
        {Array.from({ length: 8 }, (_, rank) =>
          Array.from({ length: 8 }, (_, file) => {
            const piece = getPieceAt(file, rank);
            const squareStyle = getSquareStyle(file, rank);

            // Calculate square name for aria-label
            const squareName = `${files[file]}${ranks[rank]}`;
            const feedback = squareFeedback?.[`${file}-${rank}`];

            // Handle keyboard interaction
            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSquareClick(file, rank);
              }
            };

            return (
              <div
                key={`${file}-${rank}`}
                style={squareStyle}
                onClick={() => handleSquareClick(file, rank)}
                onKeyDown={handleKeyDown}
                tabIndex={isInteractive ? 0 : -1}
                role={isInteractive ? "button" : "presentation"}
                aria-label={(() => {
                  const base = piece
                    ? t("squareWithPiece", {
                        square: squareName,
                        piece: describePiece(piece),
                      })
                    : squareName;
                  return feedback
                    ? t("squareWithFeedback", {
                        label: base,
                        feedback: t(`feedback.${feedback}`),
                      })
                    : base;
                })()}
                data-coordinate={squareName}
                data-feedback={feedback}
                className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {feedback === "missing" && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[18%] rounded-sm border-2 border-dotted border-black bg-transparent"
                  />
                )}

                {/* File coordinates (a-h on bottom row) */}
                {showCoordinates && rank === 7 && (
                  <span
                    style={{
                      ...coordinateStyle,
                      bottom: `${padding / 2}px`,
                      right: `${padding / 2}px`,
                    }}
                  >
                    {files[file]}
                  </span>
                )}

                {/* Rank coordinates (1-8 on leftmost column) */}
                {showCoordinates && file === 0 && (
                  <span
                    style={{
                      ...coordinateStyle,
                      top: `${padding / 2}px`,
                      left: `${padding / 2}px`,
                    }}
                  >
                    {ranks[rank]}
                  </span>
                )}

                {/* Chess piece, sized as a fraction of its square so it does
                    not depend on the board having been measured yet. */}
                {piece && (
                  <div className="pointer-events-none relative h-4/5 w-4/5">
                    <Image
                      src={getPieceImageUrl(piece.type, piece.color)}
                      alt={describePiece(piece)}
                      fill
                      sizes="(max-width: 640px) 12vw, 80px"
                      className="transform-gpu object-contain drop-shadow-sm"
                      priority={true}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Optional custom overlay */}
      {renderOverlay && (
        <div className="absolute inset-0 z-20">{renderOverlay(squareSize)}</div>
      )}
    </div>
    </div>
  );
}
