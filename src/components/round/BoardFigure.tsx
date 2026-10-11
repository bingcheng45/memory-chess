"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getPieceImageUrl } from "@/utils/chessPieces";
import { BOARD_SQUARES, FILES, RANKS, type SquareName } from "@/lib/game/board";
import { isDarkSquare, type LabPiece, type LabPosition } from "@/lib/round/round";

export type PieceState = "on" | "off" | "ghost";

interface PieceImageProps {
  piece: LabPiece;
  state?: PieceState;
}

/** Decorative: every board that shows a piece carries its own label. */
export function PieceImage({ piece, state = "on" }: PieceImageProps) {
  return (
    <Image
      src={getPieceImageUrl(piece.type, piece.color)}
      alt=""
      width={45}
      height={45}
      sizes="56px"
      className="lab-piece"
      data-state={state}
      draggable={false}
    />
  );
}

export function usePieceName(): (piece: LabPiece) => string {
  const t = useTranslations("game.board.pieces");
  return (piece) => t(`${piece.color}.${piece.type}`);
}

interface BoardFigureProps {
  children: ReactNode;
  /** Draws the rank and file labels round the board; off, the board takes the whole figure. */
  coordinates?: boolean;
}

export function BoardFigure({ children, coordinates = true }: BoardFigureProps) {
  if (!coordinates) return <div className="lab-figure" data-bare="">{children}</div>;
  return (
    <div className="lab-figure">
      {children}
      <div className="lab-ranks" aria-hidden="true">
        {RANKS.map((rank) => (
          <span key={rank}>{rank}</span>
        ))}
      </div>
      <div className="lab-files" aria-hidden="true">
        {FILES.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>
    </div>
  );
}

interface StaticBoardProps {
  position: LabPosition;
  pieceState?: (square: SquareName) => PieceState;
  mark?: (square: SquareName) => string | undefined;
  /** Where the square's piece falls in a staggered reveal, from 0. */
  revealOrder?: (square: SquareName) => number | undefined;
}

/** A read-only board. It is decorative; the surrounding figure carries the label. */
export function StaticBoard({ position, pieceState, mark, revealOrder }: StaticBoardProps) {
  return (
    <div className="lab-board" aria-hidden="true">
      {BOARD_SQUARES.map((square, index) => {
        const piece = position[square];
        return (
          <div
            key={square}
            className="lab-cell"
            data-dark={isDarkSquare(index) || undefined}
            data-mark={mark?.(square)}
            style={piece && revealOrder ? ({ "--reveal": revealOrder(square) ?? 0 } as CSSProperties) : undefined}
          >
            {piece && <PieceImage piece={piece} state={pieceState?.(square)} />}
          </div>
        );
      })}
    </div>
  );
}
